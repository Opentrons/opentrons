import logging
import pytest
from unittest.mock import patch
from collections import namedtuple

from opentrons.config.reset import ResetOptionId
from opentrons.config import advanced_settings


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


def test_modify_pipette_settings_call_override(api_client,
                                               mock_pipette_config,
                                               mock_pipette_data):
    pipette_id = 'p1'
    changes = {
        'fields': {
            'pickUpCurrent': {'value': 1},
            'otherField': {'value': True},
            'noneField': {'value': None}
        }
    }

    # Check that data is changed and matches the changes specified
    resp = api_client.patch(
        f'/settings/pipettes/{pipette_id}',
        json=changes)
    mock_pipette_config.override.assert_called_once_with(
        fields={'pickUpCurrent': 1, 'otherField': True, 'noneField': None},
        pipette_id=pipette_id)
    patch_body = resp.json()
    assert resp.status_code == 200
    assert patch_body == {'fields': mock_pipette_data[pipette_id]['fields'],
                          'info': mock_pipette_data[pipette_id]["info"]}


@pytest.mark.parametrize(argnames=["body"],
                         argvalues=[
                             [{}],
                             [{'fields': {}}]
                         ])
def test_modify_pipette_settings_do_not_call_override(
        api_client, mock_pipette_config, mock_pipette_data, body):
    pipette_id = 'p1'

    resp = api_client.patch(
        f'/settings/pipettes/{pipette_id}',
        json=body)
    mock_pipette_config.override.assert_not_called()
    patch_body = resp.json()
    assert resp.status_code == 200
    assert patch_body == {'fields': mock_pipette_data[pipette_id]['fields'],
                          'info': mock_pipette_data[pipette_id]["info"]}


def test_modify_pipette_settings_failure(api_client, mock_pipette_config):
    test_id = 'p1'

    def mock_override(pipette_id, fields):
        raise ValueError("Failed!")

    mock_pipette_config.override.side_effect = mock_override

    resp = api_client.patch(
        f'/settings/pipettes/{test_id}',
        json={'fields': {'a': {'value': 1}}})
    mock_pipette_config.override.assert_called_once_with(pipette_id=test_id,
                                                         fields={'a': 1})
    patch_body = resp.json()
    assert resp.status_code == 412
    assert patch_body == {'message': "Failed!"}


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


@pytest.fixture
def mock_get_all_adv_settings():
    with patch("robot_server.service.routers.settings.advanced_settings.get_all_adv_settings") as p:   # noqa: E501
        p.return_value = {
            s.id: advanced_settings.Setting(value=False, definition=s)
            for s in advanced_settings.settings
        }
        yield p


@pytest.fixture
def mock_restart_required():
    with patch("robot_server.service.routers.settings.advanced_settings.restart_required") as p:   # noqa: E501
        yield p


@pytest.fixture
def mock_set_adv_setting():
    with patch("robot_server.service.routers.settings.advanced_settings.set_adv_setting") as p:  # noqa: E501
        yield p


def validate_response_body(body, restart):
    settings_list = body.get('settings')
    assert type(settings_list) == list
    for obj in settings_list:
        assert 'id' in obj, '"id" field not found in settings object'
        assert 'title' in obj, '"title" not found for {}'.format(obj['id'])
        assert 'description' in obj, '"description" not found for {}'.format(
            obj['id'])
        assert 'value' in obj, '"value" not found for {}'.format(obj['id'])
        assert 'restart_required' in obj
    assert 'links' in body
    assert isinstance(body['links'], dict)
    assert body['links'].get('restart') == restart


@pytest.mark.parametrize(argnames=["restart_required", "link"],
                         argvalues=[
                             [False, None],
                             [True, "/server/restart"]
                         ])
def test_get(api_client, mock_get_all_adv_settings, mock_restart_required,
             restart_required, link):
    mock_restart_required.return_value = restart_required
    resp = api_client.get('/settings')
    body = resp.json()
    assert resp.status_code == 200
    validate_response_body(body, link)


@pytest.mark.parametrize(argnames=["exc", "expected_status"],
                         argvalues=[
                             [ValueError("Failure"), 400],
                             [advanced_settings.SettingException("Fail", "e"),
                              500]
                         ])
def test_set_err(api_client, mock_restart_required,
                 mock_set_adv_setting, exc, expected_status):
    mock_restart_required.return_value = False

    def raiser(i, v):
        raise exc
    mock_set_adv_setting.side_effect = raiser

    test_id = 'disableHomeOnBoot'

    resp = api_client.post(
        '/settings', json={"id": test_id, "value": True})
    body = resp.json()
    assert resp.status_code == expected_status
    assert body == {"message": str(exc)}


def test_set(api_client, mock_set_adv_setting, mock_restart_required):
    mock_restart_required.return_value = False

    test_id = 'disableHomeOnBoot'

    resp = api_client.post(
        '/settings', json={"id": test_id, "value": True})
    body = resp.json()
    assert resp.status_code == 200
    validate_response_body(body, None)
    mock_set_adv_setting.assert_called_once_with(test_id, True)
