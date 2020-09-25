import pytest
from unittest.mock import patch, MagicMock

from robot_server.service.legacy.models.control import Mount
from robot_server.service.session.session_types.live_protocol \
    import command_interface
from robot_server.service.session.session_types.\
    live_protocol.command_interface import ProtocolErrorInstrument
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
def state_store() -> StateStore:
    return StateStore()


@pytest.fixture
def command_handler(hardware, state_store):
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


async def test_handle_load_instrument(
        hardware,
        command_handler,
        load_instrument_cmd):
    with patch.object(command_interface, "create_identifier",
                      return_value="1234") as mock_id:
        response = await command_handler.handle_load_instrument(
            load_instrument_cmd
        )
        assert response.instrumentId == mock_id()


@pytest.mark.parametrize(argnames="mount",
                         argvalues=[
                             Mount.left,
                             Mount.right
                         ])
async def test_handle_load_instrument_success(
        hardware,
        command_handler,
        load_instrument_cmd,
        mount,
        state_store):
    """Test that hardware controller accepts new instrument"""
    load_instrument_cmd.mount = mount
    await command_handler.handle_load_instrument(
            load_instrument_cmd
    )
    hardware.cache_instruments.assert_called_once_with({
        load_instrument_cmd.mount.to_hw_mount():
            load_instrument_cmd.instrumentName,
        load_instrument_cmd.mount.other_mount().to_hw_mount(): None
    })


@pytest.mark.parametrize(argnames="mount",
                         argvalues=[
                             Mount.left,
                             Mount.right
                         ])
async def test_handle_load_another_instrument_success(
        hardware,
        command_handler,
        load_instrument_cmd,
        mount,
        state_store):
    """
    Test that hardware controller accepts new instrument when instruement
    is already attached to other mount.
    """
    load_instrument_cmd.mount = mount
    expected_other_name = 'p1000_single'

    def mock_get_instrument_by_mount(m):
        return expected_other_name if m is mount.other_mount().to_hw_mount() \
            else None

    mock = MagicMock(side_effect=mock_get_instrument_by_mount)
    state_store.get_instrument_by_mount = mock

    await command_handler.handle_load_instrument(
            load_instrument_cmd
    )
    hardware.cache_instruments.assert_called_once_with({
        load_instrument_cmd.mount.to_hw_mount():
            load_instrument_cmd.instrumentName,
        load_instrument_cmd.mount.other_mount().to_hw_mount():
            expected_other_name
    })


async def test_handle_load_instrument_failure(
        hardware,
        command_handler,
        load_instrument_cmd,
        state_store):
    """Test that hardware controller rejects new instrument"""
    def raiser(*args, **kwargs):
        raise RuntimeError("Failed")
    hardware.cache_instruments.side_effect = raiser

    with pytest.raises(ProtocolErrorInstrument, match='Failed'):
        await command_handler.handle_load_instrument(
            load_instrument_cmd
        )
