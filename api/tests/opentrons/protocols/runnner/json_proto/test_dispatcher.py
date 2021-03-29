import pytest
from pytest_lazyfixture import lazy_fixture
from mock import MagicMock

from opentrons.protocols.runner.json_proto.dispatcher import dispatch, DispatchError
from opentrons.protocols.runner.json_proto.models import json_protocol as models
from opentrons.protocols.runner.json_proto.abstract_command_handler import \
    AbstractCommandHandler


@pytest.fixture
def handler() -> MagicMock:
    return MagicMock(spec=AbstractCommandHandler)


@pytest.mark.parametrize(
    argnames=["command", "handler_name"],
    argvalues=[
        [lazy_fixture("aspirate_command"), "handle_aspirate"],
        [lazy_fixture("dispense_command"), "handle_dispense"],
        [lazy_fixture("air_gap_command"), "handle_air_gap"],
        [lazy_fixture("blowout_command"), "handle_blowout"],
        [lazy_fixture("touch_tip_command"), "handle_touch_tip"],
        [lazy_fixture("pick_up_command"), "handle_pick_up"],
        [lazy_fixture("drop_tip_command"), "handle_drop_tip"],
        [lazy_fixture("move_to_slot_command"), "handle_move_to_slot"],
        [lazy_fixture("delay_command"), "handle_delay"],
        [lazy_fixture("magnetic_module_engage_command"),
         "handle_magnetic_module_engage"],
        [lazy_fixture("magnetic_module_disengage_command"),
         "handle_magnetic_module_disengage"],
        [lazy_fixture("temperature_module_set_target_command"),
         "handle_temperature_module_set_target"],
        [lazy_fixture("temperature_module_await_temperature_command"),
         "handle_temperature_module_await_temperature"],
        [lazy_fixture("temperature_module_deactivate_command"),
         "handle_temperature_module_deactivate"],
        [lazy_fixture("thermocycler_set_target_block_temperature_command"),
         "handle_thermocycler_set_target_block_temperature"],
        [lazy_fixture("thermocycler_set_target_lid_temperature_command"),
         "handle_thermocycler_set_target_lid_temperature"],
        [lazy_fixture("thermocycler_await_block_temperature_command"),
         "handle_thermocycler_await_block_temperature"],
        [lazy_fixture("thermocycler_await_lid_temperature_command"),
         "handle_thermocycler_await_lid_temperature"],
        [lazy_fixture("thermocycler_deactivate_block_command"),
         "handle_thermocycler_deactivate_block"],
        [lazy_fixture("thermocycler_deactivate_lid_command"),
         "handle_thermocycler_deactivate_lid"],
        [lazy_fixture("thermocycler_open_lid_command"),
         "handle_thermocycler_open_lid"],
        [lazy_fixture("thermocycler_close_lid_command"),
         "handle_thermocycler_close_lid"],
        [lazy_fixture("thermocycler_run_profile"),
         "handle_thermocycler_run_profile"],
        [lazy_fixture("thermocycler_await_profile_complete_command"),
         "handle_thermocycler_await_profile_complete"],
        [lazy_fixture("move_to_well_command"), "handle_move_to_well"],
    ]
)
def test_dispatch_command(
        handler: MagicMock, command: models.AllCommands,
        handler_name: str) -> None:
    """It should call the correct method based on command type."""
    dispatch(command, handler)

    m = getattr(handler, handler_name)
    m.assert_called_once_with(command)


def test_dispatch_commands_fail_unknown_command(
        handler: MagicMock, thermocycler_close_lid_command) -> None:
    """It should raise on unknown command."""
    thermocycler_close_lid_command.command = "Phony"

    with pytest.raises(DispatchError):
        dispatch(thermocycler_close_lid_command, handler)


def test_dispatch_commands_fail_missing_handler(thermocycler_close_lid_command) -> None:
    """It should raise on missing handler."""
    with pytest.raises(DispatchError):
        dispatch(thermocycler_close_lid_command, None)
