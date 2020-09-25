import pytest
from unittest.mock import patch

from robot_server.service.legacy.models.control import Mount
from robot_server.service.session.session_types.live_protocol \
    import command_interface
from robot_server.service.session.session_types.live_protocol.state_store \
    import StateStore
from robot_server.service.session.models import command as models


@pytest.fixture
def get_labware(get_labware_fixture):
    with patch.object(command_interface, "get_labware_definition",
                      return_value=get_labware_fixture("fixture_12_trough")) \
            as p:
        yield p


@pytest.fixture
def labware_calibration_mock():
    with patch.object(command_interface.get, "get_labware_calibration",
                      return_value=(1, 2, 3)) as p:
        yield p


@pytest.fixture
def load_labware_cmd():
    return models.LoadLabwareRequest(
        location=1,
        loadName="labware-load-name",
        displayName="labware display name",
        namespace="opentrons test",
        version=1,
    )


@pytest.fixture
def load_instrument_cmd():
    return models.LoadInstrumentRequest(
        instrumentName='p50_single',
        mount=Mount.left
    )


@pytest.fixture
def command_handler(hardware):
    state_store = StateStore()
    ci = command_interface.CommandInterface(hardware, state_store)
    return ci


async def test_handle_load_labware(get_labware, hardware,
                                   command_handler, load_labware_cmd):

    await command_handler.handle_load_labware(load_labware_cmd)
    get_labware.assert_called_once_with(load_name=load_labware_cmd.loadName,
                                        namespace=load_labware_cmd.namespace,
                                        version=load_labware_cmd.version)


async def test_labware_path_and_def(get_labware, hardware, command_handler,
                                    load_labware_cmd, get_labware_fixture,
                                    labware_calibration_mock):
    with patch.object(command_interface.helpers, "hash_labware_def",
                      return_value="abcd1234") as hash_mock:
        await command_handler.handle_load_labware(load_labware_cmd)
        hash_mock.assert_called_once_with(get_labware())
        labware_calibration_mock.assert_called_once_with(
            f'{hash_mock()}.json', get_labware(), '')


async def test_handle_load_labware_response(get_labware, hardware,
                                            command_handler, load_labware_cmd,
                                            get_labware_fixture,
                                            labware_calibration_mock):
    with patch.object(command_interface, "create_identifier",
                      return_value="1234") as mock_id:
        response = await command_handler.handle_load_labware(
                            load_labware_cmd)
        assert response.definition == get_labware_fixture(
                                        "fixture_12_trough")
        assert response.labwareId == mock_id()
        assert response.calibration == labware_calibration_mock()


async def test_handle_load_instrumente(hardware,
                                       command_handler,
                                       load_instrument_cmd):
    with patch.object(command_interface, "create_identifier",
                      return_value="1234") as mock_id:
        response = await command_handler.handle_load_instrument(
            load_instrument_cmd
        )
        assert response.instrumentId == "1234"
