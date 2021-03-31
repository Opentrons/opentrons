import pytest
from opentrons.protocol_engine import StateView
from pytest_lazyfixture import lazy_fixture
from mock import MagicMock

from opentrons.protocols.runner.json_proto.command_translator import (
    CommandTranslator, CommandTranslatorError,
)
from opentrons.protocols.runner.json_proto.models import json_protocol as models


@pytest.fixture
def mock_state_view() -> MagicMock:
    return MagicMock(spec=StateView)


@pytest.fixture
def translator(mock_state_view) -> CommandTranslator:
    return CommandTranslator(state_view=mock_state_view)


@pytest.mark.parametrize(
    argnames=["command", "translator_method_name"],
    argvalues=[
        [lazy_fixture("aspirate_command"), "_aspirate"],
        [lazy_fixture("dispense_command"), "_dispense"],
        [lazy_fixture("air_gap_command"), "_air_gap"],
        [lazy_fixture("blowout_command"), "_blowout"],
        [lazy_fixture("touch_tip_command"), "_touch_tip"],
        [lazy_fixture("pick_up_command"), "_pick_up"],
        [lazy_fixture("drop_tip_command"), "_drop_tip"],
        [lazy_fixture("move_to_slot_command"), "_move_to_slot"],
        [lazy_fixture("delay_command"), "_delay"],
        [lazy_fixture("magnetic_module_engage_command"),
         "_magnetic_module_engage"],
        [lazy_fixture("magnetic_module_disengage_command"),
         "_magnetic_module_disengage"],
        [lazy_fixture("temperature_module_set_target_command"),
         "_temperature_module_set_target"],
        [lazy_fixture("temperature_module_await_temperature_command"),
         "_temperature_module_await_temperature"],
        [lazy_fixture("temperature_module_deactivate_command"),
         "_temperature_module_deactivate"],
        [lazy_fixture("thermocycler_set_target_block_temperature_command"),
         "_thermocycler_set_target_block_temperature"],
        [lazy_fixture("thermocycler_set_target_lid_temperature_command"),
         "_thermocycler_set_target_lid_temperature"],
        [lazy_fixture("thermocycler_await_block_temperature_command"),
         "_thermocycler_await_block_temperature"],
        [lazy_fixture("thermocycler_await_lid_temperature_command"),
         "_thermocycler_await_lid_temperature"],
        [lazy_fixture("thermocycler_deactivate_block_command"),
         "_thermocycler_deactivate_block"],
        [lazy_fixture("thermocycler_deactivate_lid_command"),
         "_thermocycler_deactivate_lid"],
        [lazy_fixture("thermocycler_open_lid_command"),
         "_thermocycler_open_lid"],
        [lazy_fixture("thermocycler_close_lid_command"),
         "_thermocycler_close_lid"],
        [lazy_fixture("thermocycler_run_profile"),
         "_thermocycler_run_profile"],
        [lazy_fixture("thermocycler_await_profile_complete_command"),
         "_thermocycler_await_profile_complete"],
        [lazy_fixture("move_to_well_command"), "_move_to_well"],
    ]
)
def test_translate_command_dispatched(
        translator: CommandTranslator, command: models.AllCommands,
        translator_method_name: str) -> None:
    """It should call the correct method based on command type."""
    # Mock the handler function.
    m = MagicMock(return_value=[])
    setattr(translator, translator_method_name, m)

    result = translator.translate(command)

    m.assert_called_once_with(command)
    assert result == []


def test_translate_commands_fail_unknown_command(
        translator: CommandTranslator, thermocycler_close_lid_command) -> None:
    """It should raise on unknown command."""
    thermocycler_close_lid_command.command = "Phony"

    with pytest.raises(CommandTranslatorError):
        translator.translate(thermocycler_close_lid_command)
