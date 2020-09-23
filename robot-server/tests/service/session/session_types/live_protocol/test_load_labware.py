import pytest
from unittest.mock import MagicMock, patch
from opentrons.protocol_api.labware import get_labware_definition
from robot_server.service.session.session_types.live_protocol import command_interface
from robot_server.service.session.session_types.live_protocol.state_store \
    import StateStore
from robot_server.service.session import models
from opentrons_shared_data.labware import load_definition


@pytest.fixture
def get_labware(get_labware_fixture):
    with patch.object(command_interface, "get_labware_definition",
                      return_value=get_labware_fixture("fixture_12_trough")) \
            as p:
        yield p


async def test_handle_load_labware(get_labware_fixture, get_labware, hardware):
    # Test that get_labware_def is called & responds correctly
    state_store = StateStore()
    ci = command_interface.CommandInterface(hardware, state_store)
    command = models.LoadLabwareRequest(
            location=1,
            loadName="labware-load-name",
            displayName="labware display name",
            namespace="opentrons test",
            version=1,
        )
    response = await ci.handle_load_labware(command)
    get_labware.assert_called_once_with(load_name=command.loadName,
                                        namespace=command.namespace,
                                        version=command.version)
    assert response.definition == get_labware_fixture("fixture_12_trough")
