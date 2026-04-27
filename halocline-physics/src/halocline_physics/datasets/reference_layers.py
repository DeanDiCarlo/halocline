"""Reference-layer placeholder for future observation context.

Phase 1 intentionally loads model geometry from the frozen TypeScript snapshot
instead of re-porting the Stage 1 GeoJSON projection code. USGS isochlors and
other observation layers remain reference-only context until calibration work.
"""

from __future__ import annotations


def reference_layers_are_calibration_data() -> bool:
    return False
