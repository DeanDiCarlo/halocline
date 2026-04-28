from __future__ import annotations

import torch
from torch import nn
import torch.nn.functional as F


class SpectralConv2d(nn.Module):
    def __init__(self, width: int, modes_height: int, modes_width: int) -> None:
        super().__init__()
        self.width = width
        self.modes_height = modes_height
        self.modes_width = modes_width
        scale = 1 / max(1, width * width)
        self.weights = nn.Parameter(
            scale * torch.randn(width, width, modes_height, modes_width, dtype=torch.cfloat)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size, channels, height, width = x.shape
        x_ft = torch.fft.rfft2(x)
        out_ft = torch.zeros(
            batch_size,
            channels,
            height,
            width // 2 + 1,
            device=x.device,
            dtype=torch.cfloat,
        )
        h_modes = min(self.modes_height, height)
        w_modes = min(self.modes_width, width // 2 + 1)
        out_ft[:, :, :h_modes, :w_modes] = torch.einsum(
            "bihw,iohw->bohw",
            x_ft[:, :, :h_modes, :w_modes],
            self.weights[:, :, :h_modes, :w_modes],
        )
        return torch.fft.irfft2(out_ft, s=(height, width))


class UNetBranch(nn.Module):
    def __init__(self, width: int) -> None:
        super().__init__()
        self.down = nn.Sequential(
            nn.Conv2d(width, width, kernel_size=3, padding=1),
            nn.GELU(),
            nn.Conv2d(width, width, kernel_size=3, padding=1),
            nn.GELU(),
        )
        self.up = nn.Sequential(
            nn.Conv2d(width, width, kernel_size=3, padding=1),
            nn.GELU(),
            nn.Conv2d(width, width, kernel_size=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        pooled = F.avg_pool2d(x, kernel_size=2, stride=2, ceil_mode=True)
        encoded = self.down(pooled)
        upsampled = F.interpolate(encoded, size=x.shape[-2:], mode="bilinear", align_corners=False)
        return self.up(upsampled)


class UFNOBlock(nn.Module):
    def __init__(self, width: int, modes_height: int, modes_width: int) -> None:
        super().__init__()
        self.spectral = SpectralConv2d(width, modes_height, modes_width)
        self.local = nn.Conv2d(width, width, kernel_size=1)
        self.unet = UNetBranch(width)
        self.norm = nn.GroupNorm(1, width)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        y = self.spectral(x) + self.local(x) + self.unet(x)
        return F.gelu(self.norm(y))


class UFNO(nn.Module):
    def __init__(
        self,
        *,
        in_channels: int,
        out_channels: int = 2,
        width: int = 32,
        modes_height: int = 12,
        modes_width: int = 12,
        depth: int = 4,
        scalar_channels: int = 7,
    ) -> None:
        super().__init__()
        self.scalar_channels = scalar_channels
        self.lift = nn.Conv2d(in_channels + scalar_channels, width, kernel_size=1)
        self.blocks = nn.ModuleList(
            [UFNOBlock(width, modes_height, modes_width) for _ in range(depth)]
        )
        self.project = nn.Sequential(
            nn.Conv2d(width, width, kernel_size=1),
            nn.GELU(),
            nn.Conv2d(width, out_channels, kernel_size=1),
        )

    def forward(
        self,
        inputs_grid: torch.Tensor,
        inputs_scalar: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        height, width = inputs_grid.shape[-2:]
        scalar_grid = inputs_scalar[:, :, None, None].expand(-1, -1, height, width)
        x = self.lift(torch.cat([inputs_grid, scalar_grid], dim=1))
        for block in self.blocks:
            x = block(x)
        return self.project(x) * mask
