import pytest
from unittest.mock import patch
from robot_server.service.session import models
from robot_server.service.session.models import command as models
from robot_server.service.session.command_execution \
    import create_command, CommandResult
from robot_server.service.session.session_types.live_protocol.state_store \
    import StateStore, LabwareEntry


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
    with patch.object(StateStore, "handle_load_labware"):
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


@pytest.mark.parametrize(
    argnames="command_name, handler",
    argvalues=[[models.EquipmentCommand.load_labware, "handle_load_labware"]]
)
def test_command_result_state_handler(command_name, handler):

    with patch.object(StateStore, handler) as handler_mock:
        store = StateStore()
        command = create_command(name=command_name, data=None)
        command_result = CommandResult(
            started_at=command.meta.created_at,
            completed_at=command.meta.created_at,
        )
        store.handle_command_result(command, command_result)
        handler_mock.assert_called_once_with(command, command_result)


def test_store_property_update():
    store = StateStore()
    command = create_command(name=models.EquipmentCommand.load_labware,
                             data=models.LoadLabwareRequest(
                                    location=1,
                                    loadName="labware-load-name",
                                    displayName="labware display name",
                                    namespace="opentrons test",
                                    version=1,
                                    ))
    command_result = CommandResult(
        started_at=command.meta.created_at,
        completed_at=command.meta.created_at,
        data=models.LoadLabwareResponse(labwareId="1234",
                                        definition={"myLabware": "definition"},
                                        calibration=(1, 2, 3)))
    assert command_result.data.labwareId not in store._labware.keys()
    store.handle_command_result(command, command_result)
    assert command_result.data.labwareId in store._labware.keys()
    assert store._labware.get(command_result.data.labwareId) == \
        LabwareEntry(definition={"myLabware": "definition"},
                     calibration=(1, 2, 3),
                     deckLocation=1)
