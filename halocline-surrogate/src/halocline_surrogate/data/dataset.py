from __future__ import annotations

from pathlib import Path

import h5py
import numpy as np
import torch
from torch.utils.data import Dataset


class HaloclineDataset(Dataset):
    def __init__(self, path: str | Path, *, preload: bool = True) -> None:
        self.path = Path(path)
        self.preload = preload
        with h5py.File(self.path, "r") as h5:
            self.length = int(h5.attrs["n"])
            self.row_count = int(h5.attrs["row_count"])
            self.col_count = int(h5.attrs["col_count"])
            if preload:
                self.inputs_grid = np.asarray(h5["inputs_grid"], dtype=np.float32)
                self.inputs_scalar = np.asarray(h5["inputs_scalar"], dtype=np.float32)
                self.inputs_wells = np.asarray(h5["inputs_wells"], dtype=np.float32)
                self.inputs_canals = np.asarray(h5["inputs_canals"], dtype=np.float32)
                self.targets = np.asarray(h5["targets"], dtype=np.float32)

    def __len__(self) -> int:
        return self.length

    def __getitem__(self, index: int) -> dict[str, torch.Tensor]:
        if self.preload:
            inputs_grid = torch.from_numpy(self.inputs_grid[index])
            inputs_scalar = torch.from_numpy(self.inputs_scalar[index])
            inputs_wells = torch.from_numpy(self.inputs_wells[index])
            inputs_canals = torch.from_numpy(self.inputs_canals[index])
            targets = torch.from_numpy(self.targets[index])
        else:
            with h5py.File(self.path, "r") as h5:
                inputs_grid = torch.from_numpy(np.asarray(h5["inputs_grid"][index], dtype=np.float32))
                inputs_scalar = torch.from_numpy(np.asarray(h5["inputs_scalar"][index], dtype=np.float32))
                inputs_wells = torch.from_numpy(np.asarray(h5["inputs_wells"][index], dtype=np.float32))
                inputs_canals = torch.from_numpy(np.asarray(h5["inputs_canals"][index], dtype=np.float32))
                targets = torch.from_numpy(np.asarray(h5["targets"][index], dtype=np.float32))
        mask = inputs_grid[0:1]
        return {
            "inputs_grid": inputs_grid,
            "inputs_scalar": inputs_scalar,
            "inputs_wells": inputs_wells,
            "inputs_canals": inputs_canals,
            "targets": targets,
            "mask": mask,
        }
