import pytest
from unittest.mock import MagicMock, PropertyMock, patch

import typing
from pydantic.main import BaseModel

from opentrons.calibration.check.session import CheckCalibrationSession, \
    CalibrationCheckState, CalibrationCheckTrigger
from opentrons.calibration.check.models import SessionType, JogPosition
from opentrons.calibration.check.helper_classes import PipetteInfo, PipetteRank
from opentrons import types

from robot_server.service.dependencies import get_session_manager


@pytest.fixture
def session_details():
    sess_dict = {
        'attributes': {
            'details': {
                'comparisonsByStep': {},
                'currentStep': 'preparingFirstPipette',
                'instruments': {},
                'labware': [],
            },
            'sessionType': 'calibrationCheck',
        },
        'type': 'Session',
        'id': 'calibrationCheck'
    }
    return sess_dict


@pytest.fixture
def mock_cal_session(hardware, loop):

    mock_pipette_info_by_mount = {
        types.Mount.LEFT: PipetteInfo(
            tiprack_id=None,
            critical_point=None,
            rank=PipetteRank.second,
            mount=types.Mount.LEFT
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
            'channels': 1},
        types.Mount.RIGHT: {
            'model': 'p300_single_v1',
            'has_tip': False,
            'max_volume': 300,
            'name': 'p300_single',
            'tip_length': 0,
            'channels': 1}
    }

    CheckCalibrationSession._get_pip_info_by_mount =\
        MagicMock(return_value=mock_pipette_info_by_mount)
    CheckCalibrationSession.pipettes = mock_hw_pipettes

    m = CheckCalibrationSession(hardware)

    async def async_mock(*args, **kwargs):
        pass

    m.trigger_transition = MagicMock(side_effect=async_mock)
    m.delete_session = MagicMock(side_effect=async_mock)

    path = 'opentrons.calibration.check.session.' \
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
    r = "robot_server.service.routers.session.CheckCalibrationSession.build"
    with patch(r) as p:
        async def mock_build(hardware):
            return mock_cal_session
        p.side_effect = mock_build
        yield p


@pytest.fixture
def session_manager_with_session(mock_cal_session):
    manager = get_session_manager()
    manager.sessions[SessionType.calibration_check] = mock_cal_session

    yield mock_cal_session

    if SessionType.calibration_check in manager.sessions:
        del manager.sessions[SessionType.calibration_check]


@pytest.fixture
def session_hardware_info(mock_cal_session, session_details):
    current_state = mock_cal_session.current_state_name
    lw_status = mock_cal_session.labware_status.values()
    comparisons_by_step = mock_cal_session.get_comparisons_by_step()
    instruments = {
        str(k): {'model': v.model,
                 'name': v.name,
                 'tip_length': v.tip_length,
                 'mount': v.mount,
                 'has_tip': v.has_tip,
                 'tiprack_id': str(v.tiprack_id),
                 'rank': v.rank}
        for k, v in mock_cal_session.pipette_status().items()
    }
    info = {
        'instruments': instruments,
        'labware': [{
            'alternatives': data.alternatives,
            'slot': data.slot,
            'id': str(data.id),
            'forMounts': [str(m) for m in data.forMounts],
            'loadName': data.loadName,
            'namespace': data.namespace,
            'version': str(data.version)} for data in lw_status],
        'currentStep': current_state,
        'comparisonsByStep': comparisons_by_step
    }
    session_details["attributes"].update({"details": info})
    return session_details


def test_create_session_already_present(api_client,
                                        session_manager_with_session):
    response = api_client.post("/sessions", json={
        "data": {
            "type": "Session",
            "attributes": {
                "sessionType": "calibrationCheck"
            }
        }
    })
    assert response.json() == {
        'errors': [{
            'detail': "A session with id 'calibrationCheck' already exists. "
                      "Please delete to proceed.",
            'links': {'DELETE': '/sessions/calibrationCheck'},
            'status': '409',
            'title': 'Conflict'
        }]
    }
    assert response.status_code == 409


def test_create_session_error(api_client,
                              patch_build_session):
    async def raiser(hardware):
        raise AssertionError("Please attach pipettes before proceeding")

    patch_build_session.side_effect = raiser

    response = api_client.post("/sessions", json={
        "data": {
            "type": "Session",
            "attributes": {
                "sessionType": "calibrationCheck"
            }
        }
    })
    assert response.json() == {
        'errors': [{
            'detail': "Failed to create session of type 'calibrationCheck': "
                      "Please attach pipettes before proceeding.",
            'status': '400',
            'title': 'Creation Failed'}
        ]}
    assert response.status_code == 400


def test_create_session(api_client, patch_build_session,
                        session_hardware_info):
    response = api_client.post("/sessions", json={
        "data": {
            "type": "Session",
            "attributes": {
                "sessionType": "calibrationCheck"
            }
        }
    })

    assert response.json() == {
        'data': session_hardware_info,
        'links': {
            'POST': {
                'href': '/sessions/calibrationCheck/commands/execute',
            },
            'GET': {
                'href': '/sessions/calibrationCheck',
            },
            'DELETE': {
                'href': '/sessions/calibrationCheck',
            },
        }
    }
    assert response.status_code == 201
    # Clean up
    get_session_manager().sessions.clear()


def test_delete_session_not_found(api_client):
    response = api_client.delete("/sessions/calibrationCheck")
    assert response.json() == {
        'errors': [{
            'detail': "Cannot find session with id 'calibrationCheck'.",
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_delete_session(api_client, session_manager_with_session,
                        mock_cal_session,
                        session_hardware_info):
    response = api_client.delete("/sessions/calibrationCheck")
    mock_cal_session.delete_session.assert_called_once()
    assert response.json() == {
        'data': session_hardware_info,
        'links': {
            'POST': {
                'href': '/sessions',
            },
        }
    }
    assert response.status_code == 200


def test_get_session_not_found(api_client):
    response = api_client.get("/sessions/1234")
    assert response.json() == {
        'errors': [{
            'detail': "Cannot find session with id '1234'.",
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_get_session(api_client, session_manager_with_session,
                     session_hardware_info):
    response = api_client.get("/sessions/calibrationCheck")
    assert response.json() == {
        'data': session_hardware_info,
        'links': {
            'POST': {
                'href': '/sessions/calibrationCheck/commands/execute',
            },
            'GET': {
                'href': '/sessions/calibrationCheck',
            },
            'DELETE': {
                'href': '/sessions/calibrationCheck',
            },
        }
    }
    assert response.status_code == 200


def test_get_sessions_no_sessions(api_client):
    response = api_client.get("/sessions")
    assert response.json() == {
        'data': [],
    }
    assert response.status_code == 200


def test_get_sessions(api_client, session_manager_with_session,
                      session_hardware_info):
    response = api_client.get("/sessions")
    assert response.json() == {
        'data': [session_hardware_info],
    }
    assert response.status_code == 200


def command(command_type: str, body: typing.Optional[BaseModel]):
    """Helper to create command"""
    return {
        "data": {
            "type": "SessionCommand",
            "attributes": {
                "command": command_type,
                "data": body.dict(exclude_unset=True) if body else {}
            }
        }
    }


def test_session_command_create_no_session(api_client):
    response = api_client.post(
        "/sessions/1234/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3))))
    assert response.json() == {
        'errors': [{
            'detail': "Cannot find session with id '1234'.",
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_session_command_execute(api_client,
                                 session_manager_with_session,
                                 mock_cal_session,
                                 session_hardware_info):
    response = api_client.post(
        "/sessions/calibrationCheck/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3))))

    mock_cal_session.trigger_transition.assert_called_once_with(
        trigger="jog",
        vector=(1.0, 2.0, 3.0))

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'jog',
                'data': {'vector': [1.0, 2.0, 3.0]},
                'status': 'executed'
            },
            'type': 'SessionCommand',
            'id': response.json()['data']['id']
        },
        'links': {
            'POST': {
                'href': '/sessions/calibrationCheck/commands/execute',
            },
            'GET': {
                'href': '/sessions/calibrationCheck',
            },
            'DELETE': {
                'href': '/sessions/calibrationCheck',
            },
        }
    }
    assert response.status_code == 200


def test_session_command_execute_no_body(api_client,
                                         session_manager_with_session,
                                         mock_cal_session,
                                         session_hardware_info):
    response = api_client.post(
        "/sessions/calibrationCheck/commands/execute",
        json=command("loadLabware", None)
    )

    mock_cal_session.trigger_transition.assert_called_once_with(
        trigger="loadLabware")

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'loadLabware',
                'data': {},
                'status': 'executed'
            },
            'type': 'SessionCommand',
            'id': response.json()['data']['id']
        },
        'links': {
            'POST': {
                'href': '/sessions/calibrationCheck/commands/execute',
            },
            'GET': {
                'href': '/sessions/calibrationCheck',
            },
            'DELETE': {
                'href': '/sessions/calibrationCheck',
            },
        }
    }
    assert response.status_code == 200


def test_session_command_execute_raise(api_client,
                                       session_manager_with_session,
                                       mock_cal_session):

    async def raiser(*args, **kwargs):
        raise AssertionError("Cannot do it")

    mock_cal_session.trigger_transition.side_effect = raiser

    response = api_client.post(
        "/sessions/calibrationCheck/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3))))

    assert response.json() == {
        'errors': [
            {
                'detail': 'Cannot do it',
                'status': '400',
                'title': 'Exception'
            }
        ]
    }
    assert response.status_code == 400
