import logging
import pytest
from unittest.mock import patch
from collections import namedtuple

from opentrons.config.reset import ResetOptionId


# TDOD(isk: 3/20/20): test validation errors after refactor
# return {message: string}
@pytest.mark.parametrize(
    "log_level, syslog_level, expected_message",
    [
        (
            "error",
            "err",
            {"message": "Upstreaming log level changed to error"}
        ), (
            "ERROR",
            "err",
            {"message": "Upstreaming log level changed to error"}
        ), (
            "warning",
            "warning",
            {"message": "Upstreaming log level changed to warning"}
        ), (
            "WARNING",
            "warning",
            {"message": "Upstreaming log level changed to warning"}
        ), (
            "info",
            "info",
            {"message": "Upstreaming log level changed to info"}
        ), (
            "INFO",
            "info",
            {"message": "Upstreaming log level changed to info"}
        ), (
            "debug",
            "debug",
            {"message": "Upstreaming log level changed to debug"}
        ), (
            "DEBUG",
            "debug",
            {"message": "Upstreaming log level changed to debug"}
        ), (
            None,
            "emerg",
            {"message": "Upstreaming logs disabled"}
        ), (
            None,
            "emerg",
            {"message": "Upstreaming logs disabled"}
        )
    ]
)
def test_post_log_level_upstream(
    api_client,
    log_level,
    syslog_level,
    expected_message
):
    async def mock_set_syslog_level(syslog_level):
        return 0, "stdout", "stderr"

    with patch("opentrons.system.log_control.set_syslog_level") as m:
        m.side_effect = mock_set_syslog_level
        response = api_client.post(
            "/settings/log_level/upstream", json={"log_level": log_level}
        )
        body = response.json()
        assert response.status_code == 200
        assert body == expected_message
        m.assert_called_once_with(syslog_level)


def test_post_log_level_upstream_fails_reload(api_client):
    log_level = "debug"

    async def mock_set_syslog_level(syslog_level):
        return 1, "stdout", "stderr"

    with patch("opentrons.system.log_control.set_syslog_level") as m:
        m.side_effect = mock_set_syslog_level
        response = api_client.post(
            "/settings/log_level/upstream", json={"log_level": log_level}
        )
        body = response.json()
        assert response.status_code == 500
        assert body == {"message": "Could not reload config: stdout stderr"}
        m.assert_called_once_with(log_level)


def test_get_robot_settings(api_client, hardware):
    Conf = namedtuple("Conf", ("a", "b", "c"))
    hardware.config = Conf("test", "this", 5)

    res = api_client.get("/settings/robot")

    assert res.status_code == 200
    assert res.json() == {
        "a": "test",
        "b": "this",
        "c": 5
    }


@pytest.fixture
def mock_pipette_data():
    return {
        'p1': {
            'info': {
                'name': 'p1_name',
                'model': 'p1_model',
            },
            'fields': {
                'pickUpCurrent': {
                    'units': 'mm',
                    'type': 'float',
                    'min': 0.0,
                    'max': 2.0,
                    'default': 1.0,
                    'value': 0.5,
                },
                'quirks': {
                    'dropTipShake': True
                }
            }
        },
        'p2': {
            'info': {
                'name': 'p2_name',
                'model': 'p2_model',
            },
            'fields': {
                'pickUpIncrement': {
                    'units': 'inch',
                    'type': 'int',
                    'min': 0,
                    'max': 2,
                    'default': 1.,
                    'value': 2,
                }
            }
        }
    }


@pytest.fixture
def mock_pipette_config(mock_pipette_data):
    with patch("robot_server.service.routers.settings.pipette_config") as p:
        p.known_pipettes.return_value = list(mock_pipette_data.keys())
        p.load_config_dict.side_effect = \
            lambda id: mock_pipette_data[id]['info']
        p.list_mutable_configs.side_effect = \
            lambda pipette_id: mock_pipette_data[pipette_id]['fields']
        yield p


def test_receive_pipette_settings(api_client,
                                  mock_pipette_config,
                                  mock_pipette_data):

    resp = api_client.get('/settings/pipettes')
    assert resp.status_code == 200
    assert resp.json() == mock_pipette_data


def test_receive_pipette_settings_unknown(api_client,
                                          mock_pipette_config,
                                          mock_pipette_data):
    # Non-existent pipette id and get 404
    resp = api_client.get('/settings/pipettes/wannabepipette')
    assert resp.status_code == 404


def test_receive_pipette_settings_found(api_client,
                                        mock_pipette_config,
                                        mock_pipette_data):
    resp = api_client.get('/settings/pipettes/p1')
    assert resp.status_code == 200
    assert resp.json() == mock_pipette_data['p1']


def test_available_resets(api_client):
    resp = api_client.get('/settings/reset/options')
    body = resp.json()
    options_list = body.get('options')
    assert resp.status_code == 200
    assert sorted(['tipProbe', 'labwareCalibration', 'bootScripts'])\
        == sorted([item['id'] for item in options_list])


@pytest.fixture
def mock_reset():
    with patch("robot_server.service.routers.settings.reset_util.reset") as m:
        yield m


@pytest.mark.parametrize(argnames="body,called_with",
                         argvalues=[
                             # Empty body
                             [{}, set()],
                             # None true
                             [{
                                 'labwareCalibration': False,
                                 'tipProbe': False,
                                 'bootScripts': False
                             }, set()],
                             # All set
                             [{
                                 'labwareCalibration': True,
                                 'tipProbe': True,
                                 'bootScripts': True
                             }, set(v for v in ResetOptionId)],
                             [{'labwareCalibration': True},
                              {ResetOptionId.labware_calibration}],
                             [{'tipProbe': True},
                              {ResetOptionId.tip_probe}],
                             [{'bootScripts': True},
                              {ResetOptionId.boot_scripts}],
                         ])
def test_reset_success(api_client, mock_reset, body, called_with):
    resp = api_client.post('/settings/reset', json=body)
    assert resp.status_code == 200
    mock_reset.assert_called_once_with(called_with)


def test_reset_invalid_option(api_client, mock_reset):
    resp = api_client.post('/settings/reset', json={'aksgjajhadjasl': False})
    assert resp.status_code == 422
    # TODO Blocked by https://github.com/Opentrons/opentrons/issues/5285
    # body = resp.json()
    # assert 'message' in body
    # assert 'aksgjajhadjasl' in body['message']


@pytest.fixture
def hardware_log_level(hardware):
    async def update_config(*args, **kwargs):
        pass

    hardware.update_config.side_effect = update_config
    return hardware


@pytest.fixture()
def mock_robot_configs():
    with patch("robot_server.service.routers.settings.robot_configs") as m:
        yield m


@pytest.fixture()
def mock_logging_set_level():
    with patch("logging.Logger.setLevel") as m:
        yield m


@pytest.mark.parametrize(argnames=["body"],
                         argvalues=[
                             [{}],
                             [{'log_level': None}],
                             [{'log_level': 'oafajhshda'}]
                         ])
def test_set_log_level_invalid(api_client, body,
                               hardware_log_level, mock_logging_set_level,
                               mock_robot_configs):
    resp = api_client.post('/settings/log_level/local', json=body)
    assert resp.status_code == 422
    mock_logging_set_level.assert_not_called()
    hardware_log_level.update_config.assert_not_called()
    mock_robot_configs.save_robot_settings.assert_not_called()


@pytest.mark.parametrize(argnames=["body",
                                   "expected_log_level",
                                   "expected_log_level_name"],
                         argvalues=[
                             [{'log_level': 'debug'},
                              logging.DEBUG, "DEBUG"],
                             [{'log_level': 'deBug'},
                              logging.DEBUG, "DEBUG"],
                             [{'log_level': 'info'},
                              logging.INFO, "INFO"],
                             [{'log_level': 'INFO'},
                              logging.INFO, "INFO"],
                             [{'log_level': 'warning'},
                              logging.WARNING, "WARNING"],
                             [{'log_level': 'warninG'},
                              logging.WARNING, "WARNING"],
                             [{'log_level': 'error'},
                              logging.ERROR, "ERROR"],
                             [{'log_level': 'ERROR'},
                              logging.ERROR, "ERROR"],
                         ])
def test_set_log_level(api_client, hardware_log_level,
                       mock_robot_configs, mock_logging_set_level,
                       body, expected_log_level, expected_log_level_name):
    resp = api_client.post('/settings/log_level/local', json=body)
    assert resp.status_code == 200
    mock_logging_set_level.assert_called_once_with(expected_log_level)
    hardware_log_level.update_config.assert_called_once_with(
        log_level=expected_log_level_name)
    mock_robot_configs.save_robot_settings.assert_called_once()
