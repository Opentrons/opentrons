"""Pipetting command handler."""
import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]
from typing import cast

from opentrons.types import Mount
from opentrons.hardware_control.dev_types import PipetteDict

from opentrons.protocol_engine import command_models as cmd
from opentrons.protocol_engine.state import TipGeometry, HardwarePipette
from opentrons.protocol_engine.execution.movement import MovementHandler
from opentrons.protocol_engine.execution.pipetting import PipettingHandler


@pytest.fixture
def mock_movement_handler() -> AsyncMock:
    """Get an asynchronous mock in the shape of an MovementHandler."""
    return AsyncMock(spec=MovementHandler)


@pytest.fixture
def handler(
    mock_state_view: MagicMock,
    mock_hardware: AsyncMock,
    mock_movement_handler: AsyncMock,
) -> PipettingHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return PipettingHandler(
        state=mock_state_view,
        hardware=mock_hardware,
        movement_handler=mock_movement_handler,
    )


async def test_handle_pick_up_tip_request(
    mock_state_view: MagicMock,
    mock_hardware: AsyncMock,
    mock_movement_handler: AsyncMock,
    handler: PipettingHandler,
) -> None:
    """It should handle a PickUpTipRequest properly."""
    request = cmd.PickUpTipRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="B2",
    )

    mock_config = cast(PipetteDict, {"name": "p300_single"})
    mock_attached_pipettes = {Mount.LEFT: mock_config, Mount.RIGHT: None}

    mock_hardware.attached_instruments = mock_attached_pipettes

    mock_state_view.pipettes.get_hardware_pipette.return_value = HardwarePipette(
        mount=Mount.LEFT,
        config=mock_config,
    )

    mock_state_view.geometry.get_tip_geometry.return_value = TipGeometry(
        effective_length=50,
        diameter=5,
        volume=300,
    )

    result = await handler.handle_pick_up_tip(request)

    assert result == cmd.PickUpTipResult()

    mock_movement_handler.handle_move_to_well.assert_called_with(request)

    mock_hardware.assert_has_calls([
        call.pick_up_tip(
            mount=Mount.LEFT,
            tip_length=50,
            presses=None,
            increment=None,
        ),
        call.set_current_tiprack_diameter(mount=Mount.LEFT, tiprack_diameter=5),
        call.set_working_volume(mount=Mount.LEFT, tip_volume=300)
    ])

    mock_state_view.pipettes.get_hardware_pipette.assert_called_with(
        pipette_id="pipette-id",
        attached_pipettes=mock_attached_pipettes,
    )

    mock_state_view.geometry.get_tip_geometry.assert_called_with(
        labware_id="labware-id",
        well_name="B2",
        pipette_config={"name": "p300_single"},
    )
