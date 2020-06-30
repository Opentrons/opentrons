import pytest
from unittest.mock import MagicMock, PropertyMock, patch

from robot_server.robot.calibration.check.session import \
    CheckCalibrationSession, CalibrationCheckState, CalibrationCheckTrigger
from robot_server.robot.calibration.check.models import JogPosition
from robot_server.robot.calibration.helper_classes import PipetteInfo,\
    PipetteRank
from opentrons import types
from robot_server.robot.calibration.session import CalibrationException, \
    NoPipetteException
from robot_server.robot.calibration.check.util import StateMachineError

from robot_server.service.session.command_execution import create_command
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models import CommandName, EmptyModel
from robot_server.service.session.session_types import CheckSession, \
    SessionMetaData, BaseSession

from robot_server.service.session.errors import SessionCreationException, \
    SessionCommandException


@pytest.fixture
def mock_cal_session(hardware):
    mock_pipette_info_by_mount = {
        types.Mount.LEFT: PipetteInfo(
            tiprack_id=None,
            critical_point=None,
            rank=PipetteRank.second,
            mount=types.Mount.LEFT,
        ),
        types.Mount.RIGHT: PipetteInfo(
            tiprack_id=None,
            critical_point=None,
            rank=PipetteRank.first,
            mount=types.Mount.RIGHT
        )
    }
    mock_hw_pipettes = {
        types.Mount.LEFT: {
            'model': 'p10_single_v1',
            'has_tip': False,
            'max_volume': 10,
            'name': 'p10_single',
            'tip_length': 0,
            'channels': 1,
            'pipette_id': 'pipette id 1'},
        types.Mount.RIGHT: {
            'model': 'p300_single_v1',
            'has_tip': False,
            'max_volume': 300,
            'name': 'p300_single',
            'tip_length': 0,
            'channels': 1,
            'pipette_id': 'pipette id 2'}
    }

    CheckCalibrationSession._get_pip_info_by_mount =\
        MagicMock(return_value=mock_pipette_info_by_mount)
    CheckCalibrationSession.pipettes = mock_hw_pipettes

    m = CheckCalibrationSession(hardware)

    async def async_mock(*args, **kwargs):
        pass

    m.trigger_transition = MagicMock(side_effect=async_mock)
    m.delete_session = MagicMock(side_effect=async_mock)

    path = 'robot_server.robot.calibration.check.session.' \
           'CheckCalibrationSession.current_state_name'
    with patch(path, new_callable=PropertyMock) as p:
        p.return_value = CalibrationCheckState.preparingFirstPipette.value

        m.get_potential_triggers = MagicMock(return_value={
            CalibrationCheckTrigger.jog,
            CalibrationCheckTrigger.pick_up_tip,
            CalibrationCheckTrigger.exit
        })
        yield m


@pytest.fixture
def patch_build_session(mock_cal_session):
    r = "robot_server.service.session.session_types." \
        "check_session.CheckCalibrationSession.build"
    with patch(r) as p:
        async def build(hardware):
            return mock_cal_session
        p.side_effect = build
        yield p


@pytest.fixture
def check_session_instance(patch_build_session, hardware, loop) -> BaseSession:
    return loop.run_until_complete(
        CheckSession.create(
            configuration=SessionConfiguration(hardware=hardware,
                                               is_active=lambda x: False),
            instance_meta=SessionMetaData()
        )
    )


@pytest.fixture
def session_hardware_info(mock_cal_session):
    current_state = mock_cal_session.current_state_name
    lw_status = mock_cal_session.labware_status.values()
    comparisons_by_step = mock_cal_session.get_comparisons_by_step()
    instruments = {
        str(k): {'model': v.model,
                 'name': v.name,
                 'tip_length': v.tip_length,
                 'mount': v.mount,
                 'has_tip': v.has_tip,
                 'tiprack_id': v.tiprack_id,
                 'rank': v.rank,
                 'serial': v.serial}
        for k, v in mock_cal_session.pipette_status().items()
    }
    info = {
        'instruments': instruments,
        'labware': [{
            'alternatives': data.alternatives,
            'slot': data.slot,
            'id': data.id,
            'forMounts': [str(m) for m in data.forMounts],
            'loadName': data.loadName,
            'namespace': data.namespace,
            'version': str(data.version)} for data in lw_status],
        'currentStep': current_state,
        'comparisonsByStep': comparisons_by_step,
        'nextSteps': None,
    }
    return info


@pytest.mark.parametrize(argnames="build_exception",
                         argvalues=[AssertionError,
                                    CalibrationException,
                                    NoPipetteException])
async def test_create_session_error(hardware, patch_build_session,
                                    build_exception):
    async def raiser(x):
        raise build_exception("Please attach pipettes before proceeding")

    patch_build_session.side_effect = raiser

    with pytest.raises(SessionCreationException):
        await CheckSession.create(
            configuration=SessionConfiguration(hardware=hardware,
                                               is_active=lambda x: False),
            instance_meta=SessionMetaData()
        )


async def test_clean_up_deletes_session(check_session_instance,
                                        mock_cal_session):
    await check_session_instance.clean_up()
    mock_cal_session.delete_session.assert_called_once()


def test_get_response_details(check_session_instance, session_hardware_info):
    response = check_session_instance._get_response_details()
    assert response.dict() == session_hardware_info


async def test_session_command_execute(check_session_instance,
                                       mock_cal_session):
    await check_session_instance.command_executor.execute(
        create_command(
            CommandName.jog,
            JogPosition(vector=(1, 2, 3)))
    )

    mock_cal_session.trigger_transition.assert_called_once_with(
        trigger="jog",
        vector=(1.0, 2.0, 3.0)
    )


async def test_session_command_execute_no_body(check_session_instance,
                                               mock_cal_session):
    await check_session_instance.command_executor.execute(
        create_command(
            CommandName.load_labware,
            EmptyModel())
    )

    mock_cal_session.trigger_transition.assert_called_once_with(
        trigger="loadLabware"
    )


@pytest.mark.parametrize(argnames="command_exception",
                         argvalues=[AssertionError,
                                    StateMachineError,
                                    CalibrationException,
                                    NoPipetteException])
async def test_session_command_execute_raise(check_session_instance,
                                             mock_cal_session,
                                             command_exception):

    async def raiser(*args, **kwargs):
        raise command_exception("Cannot do it")

    mock_cal_session.trigger_transition.side_effect = raiser

    with pytest.raises(SessionCommandException):
        await check_session_instance.command_executor.execute(
            create_command(CommandName.jog, JogPosition(vector=(1, 2, 3)))
        )
