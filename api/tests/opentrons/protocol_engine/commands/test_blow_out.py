"""Test blow-out command."""
from decoy import Decoy
import pytest
from dataclasses import dataclass, field
from typing import cast, Dict

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.state import StateView, HardwarePipette
from opentrons.protocol_engine.commands import (
    BlowOutResult,
    BlowOutImplementation,
    BlowOutParams,
)
from opentrons.protocol_engine.execution import (
    MovementHandler,
)
from opentrons.types import Mount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control import HardwareControlAPI

@dataclass(frozen=True)
class MockPipettes:
    """Dummy pipette data to use in liquid handling collabortation tests."""

    left_config: PipetteDict = field(
        default_factory=lambda: cast(
            PipetteDict, {"name": "p300_single", "pipette_id": "123"}
        )
    )
    right_config: PipetteDict = field(
        default_factory=lambda: cast(
            PipetteDict, {"name": "p300_multi", "pipette_id": "abc"}
        )
    )

    @property
    def by_mount(self) -> Dict[Mount, PipetteDict]:
        """Get a mock hw.attached_instruments map."""
        return {Mount.LEFT: self.left_config, Mount.RIGHT: self.right_config}



@pytest.fixture
def mock_hw_pipettes(hardware_api: HardwareAPI) -> MockPipettes:
    """Get mock pipette configs and attach them to the mock HW controller."""
    mock_hw_pipettes = MockPipettes()
    hardware_api.attached_instruments = mock_hw_pipettes.by_mount  # type: ignore[misc]
    return mock_hw_pipettes


async def test_blow_out_implementation(
    decoy: Decoy,
    state_view: StateView,
    hardware_api: HardwareControlAPI,
    movement: MovementHandler,
    mock_hw_pipettes: MockPipettes,
) -> None:
    """A PickUpTipCreate should have an execution implementation."""
    subject = BlowOutImplementation(state_view=state_view, movement=movement, hardware_api=hardware_api)

    left_pipette = HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    decoy.when(
        state_view.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )

    data = BlowOutParams(
        pipetteId="abc", labwareId="123", wellName="A3", wellLocation=location
    )

    result = await subject.execute(data)

    assert isinstance(result, BlowOutResult)

    decoy.verify(
        state_view.pipettes.get_hardware_pipette(pipette_id="pipette-id", attached_pipettes=mock_hw_pipettes.by_mount),
        await movement.move_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="C6",
            well_location=location,
        ),
        await hardware_api.blow_out(mount=left_pipette.mount),
    )
