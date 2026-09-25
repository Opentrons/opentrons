"""Run setup navigation test plan (not implemented yet).

Planned flows:
- Unconfigured: instruments attached (uncalibrated), deck hardware setup, LPC
- Configured: calibrated instruments, deck hardware, offsets, labware/liquids, camera
"""

from __future__ import annotations

import pytest


@pytest.mark.smoke
@pytest.mark.skip(reason="Run setup nav test not implemented yet")
def test_run_setup_placeholder() -> None:
    """Placeholder for configured/unconfigured run setup flows."""
    pass
