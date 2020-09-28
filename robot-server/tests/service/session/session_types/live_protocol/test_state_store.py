from robot_server.service.session.models import command as models
from robot_server.service.session.command_execution \
    import create_command, CommandResult
from robot_server.service.session.session_types.live_protocol.state_store \
    import StateStore


def test_handle_command_request():
    store = StateStore()
    command = create_command(
        name=models.EquipmentCommand.load_labware,
        data=models.LoadLabwareRequest(
            location=1,
            loadName="labware-load-name",
            displayName="labware display name",
            namespace="opentrons test",
            version=1,
        ),
    )
    store.handle_command_request(command)

    assert store.get_commands() == [command]


def test_store_has_handle_command_response_method():
    store = StateStore()
    command = create_command(
        name=models.EquipmentCommand.load_labware,
        data=models.LoadLabwareRequest(
            location=1,
            loadName="labware-load-name",
            displayName="labware display name",
            namespace="opentrons test",
            version=1,
        ),
    )
    command_result = CommandResult(
        started_at=command.meta.created_at,
        completed_at=command.meta.created_at,
    )

    store.handle_command_result(command, command_result)

    assert store.get_command_result_by_id(
        command.meta.identifier) == command_result
