"""Shared mock definitions."""
from dataclasses import dataclass, field
from typing import cast, Dict

from opentrons.types import Mount
from opentrons.hardware_control.dev_types import PipetteDict


@dataclass(frozen=True)
class MockPipettes:
    """Dummy pipette data to use in liquid handling collaboration tests."""

    left_config: PipetteDict = field(
        default_factory=lambda: cast(
            PipetteDict,
            {
                "name": "p300_single",
                "pipette_id": "123",
                "aspirate_flow_rate": 1.23,
                "dispense_flow_rate": 1.23,
                "blow_out_flow_rate": 1.23,
                "channels": 1,
            },
        )
    )
    right_config: PipetteDict = field(
        default_factory=lambda: cast(
            PipetteDict,
            {
                "name": "p300_multi",
                "pipette_id": "abc",
                "aspirate_flow_rate": 1.23,
                "dispense_flow_rate": 1.23,
                "blow_out_flow_rate": 1.23,
                "channels": 8,
            },
        )
    )

    @property
    def by_mount(self) -> Dict[Mount, PipetteDict]:
        """Get a mock hw.attached_instruments map."""
        return {Mount.LEFT: self.left_config, Mount.RIGHT: self.right_config}
