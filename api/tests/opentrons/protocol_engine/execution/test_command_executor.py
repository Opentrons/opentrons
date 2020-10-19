"""Test CommandExecutor routing to command implementation providers."""

from opentrons.protocol_engine import errors, command_models as commands


async def test_executor_routes_load_labware(
    executor,
    mock_state_store,
    mock_equipment_handler,
    running_load_labware_command,
    load_labware_result
):
    """CommandExecutor should route LoadLabware to EquipmentHandler."""
    mock_equipment_handler.handle_load_labware.return_value = \
        load_labware_result

    completed_cmd = await executor.execute_command(
        running_load_labware_command,
        state=mock_state_store.state
    )

    assert type(completed_cmd) == commands.CompletedCommand
    assert completed_cmd.result == load_labware_result
    mock_equipment_handler.handle_load_labware.assert_called_with(
        running_load_labware_command.request,
    )


async def test_executor_handles_unexpected_error(
    executor,
    mock_state_store,
    mock_equipment_handler,
    running_load_labware_command,
    load_labware_result
):
    """CommandExecutor should handle unexpected errors."""
    error = RuntimeError('I did not see this coming')
    mock_equipment_handler.handle_load_labware.side_effect = error

    failed_cmd = await executor.execute_command(
        running_load_labware_command,
        state=mock_state_store.state
    )

    assert type(failed_cmd) == commands.FailedCommand
    assert type(failed_cmd.error) == errors.UnexpectedProtocolError
    assert str(failed_cmd.error) == str(error)


async def test_executor_routes_load_pipette(
    executor,
    mock_state_store,
    mock_equipment_handler,
    running_load_pipette_command,
    load_pipette_result
):
    """CommandExecutor should route LoadPipette to EquipmentHandler."""
    mock_equipment_handler.handle_load_pipette.return_value = \
        load_pipette_result

    completed_cmd = await executor.execute_command(
        running_load_pipette_command,
        state=mock_state_store.state
    )

    assert type(completed_cmd) == commands.CompletedCommand
    assert completed_cmd.result == load_pipette_result
    mock_equipment_handler.handle_load_pipette.assert_called_with(
        running_load_pipette_command.request,
        state=mock_state_store.state,
    )


async def test_executor_handles_load_pipette_failure(
    executor,
    mock_state_store,
    mock_equipment_handler,
    running_load_pipette_command,
    load_pipette_result
):
    """CommandExecutor should handle a failed LoadPipette"""
    error = errors.FailedToLoadPipetteError("oh no")
    mock_equipment_handler.handle_load_pipette.side_effect = error

    completed_cmd = await executor.execute_command(
        running_load_pipette_command,
        state=mock_state_store.state
    )

    assert type(completed_cmd) == commands.FailedCommand
    assert completed_cmd.error == error
