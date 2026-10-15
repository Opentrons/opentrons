from dataclasses import make_dataclass
from typing import Generator, Optional

import pytest
from decoy import Decoy
from mock import patch

from opentrons.config import advanced_settings
from opentrons.config.reset import ResetOptionId
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.persistence.persistence_directory import PersistenceResetter

from robot_server.app import app
from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store_failsafe,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.hardware import get_robot_type_enum
from robot_server.persistence.fastapi_dependencies import (
    get_images_resetter,
    get_persistence_resetter,
)
from robot_server.persistence.images_directory import ImagesResetter


def test_get_robot_settings(api_client, hardware):
    Conf = make_dataclass("Conf", ["a", "b", "c"])

    async def _dummy_return_config(*args, **kwargs):
        return Conf(a="test", b="this", c=5)

    hardware.update_config.side_effect = _dummy_return_config

    res = api_client.get("/settings/robot")

    assert res.status_code == 200
    assert res.json() == {"a": "test", "b": "this", "c": 5}
    hardware.update_config.assert_called_once_with()


def test_receive_attached_pipette_settings(
    decoy: Decoy,
    api_client,
) -> None:
    resp = api_client.get("/settings/pipettes")
    assert resp.status_code == 403


def test_receive_pipette_settings(
    decoy: Decoy,
    api_client,
):
    resp = api_client.get("/settings/pipettes")
    assert resp.status_code == 403


def test_receive_pipette_settings_unknown(api_client, decoy: Decoy):
    resp = api_client.get("/settings/pipettes/wannabepipette")
    assert resp.status_code == 403


def test_receive_pipette_settings_found(
    decoy: Decoy,
    api_client,
):
    resp = api_client.get("/settings/pipettes/p1")
    assert resp.status_code == 403


def test_modify_pipette_settings_call_override(
    decoy: Decoy,
    api_client,
):
    pipette_id = "p1"
    changes = {
        "fields": {
            "pickUpCurrent": {"value": 1},
            "dropTipShake": {"value": True},
            "pickUpSpeed": {"value": None},
            "pickUpDistance": None,
        }
    }

    # Check that data is changed and matches the changes specified
    resp = api_client.patch(f"/settings/pipettes/{pipette_id}", json=changes)
    assert resp.status_code == 403


@pytest.mark.parametrize(argnames=["body"], argvalues=[[{}], [{"fields": {}}]])
def test_modify_pipette_settings_do_not_call_override(
    decoy: Decoy,
    api_client,
    body,
):
    pipette_id = "p1"

    resp = api_client.patch(f"/settings/pipettes/{pipette_id}", json=body)
    assert resp.status_code == 403


def test_modify_pipette_settings_failure(
    decoy: Decoy,
    api_client,
):
    test_id = "p1"
    test_fields = {"pickUpCurrent": {"value": 1}}

    resp = api_client.patch(
        f"/settings/pipettes/{test_id}",
        json={"fields": test_fields},
    )
    assert resp.status_code == 403


def test_available_resets(api_client):
    resp = api_client.get("/settings/reset/options")
    body = resp.json()
    options_list = body.get("options")
    assert resp.status_code == 200
    assert sorted(
        [
            "deckCalibration",
            "deckConfiguration",
            "pipetteOffsetCalibrations",
            "bootScripts",
            "tipLengthCalibrations",
            "runsHistory",
            "authorizedKeys",
        ]
    ) == sorted([item["id"] for item in options_list])


@pytest.fixture
def mock_reset():
    with patch("robot_server.service.legacy.routers.settings.reset_util.reset") as m:
        yield m


@pytest.fixture
def mock_persistence_resetter(
    decoy: Decoy,
) -> Generator[PersistenceResetter, None, None]:
    mock_persistence_resetter = decoy.mock(cls=PersistenceResetter)

    async def mock_get_persistence_resetter() -> PersistenceResetter:
        return mock_persistence_resetter

    app.dependency_overrides[get_persistence_resetter] = mock_get_persistence_resetter
    yield mock_persistence_resetter
    del app.dependency_overrides[get_persistence_resetter]


@pytest.fixture
def mock_images_resetter(
    decoy: Decoy,
) -> Generator[ImagesResetter, None, None]:
    mock_images_resetter = decoy.mock(cls=ImagesResetter)

    async def mock_get_images_resetter() -> ImagesResetter:
        return mock_images_resetter

    app.dependency_overrides[get_images_resetter] = mock_get_images_resetter
    yield mock_images_resetter
    del app.dependency_overrides[get_images_resetter]


@pytest.fixture
def mock_deck_configuration_store_failsafe(
    decoy: Decoy,
) -> Generator[Optional[DeckConfigurationStore], None, None]:
    mock_deck_configuration_store = decoy.mock(cls=DeckConfigurationStore)

    async def mock_get_deck_configuration_store_failsafe() -> DeckConfigurationStore:
        return mock_deck_configuration_store

    app.dependency_overrides[get_deck_configuration_store_failsafe] = (
        mock_get_deck_configuration_store_failsafe
    )
    yield mock_deck_configuration_store
    del app.dependency_overrides[get_deck_configuration_store_failsafe]


@pytest.mark.parametrize(
    argnames="body,called_with",
    argvalues=[
        # Empty body
        [{}, set()],
        # None true
        [
            {
                "deckCalibration": False,
                "bootScripts": False,
                "pipetteOffsetCalibrations": False,
                "tipLengthCalibrations": False,
                "runsHistory": False,
                "authorizedKeys": False,
            },
            set(),
        ],
        # All set
        [
            {
                "bootScripts": True,
                "pipetteOffsetCalibrations": True,
                "tipLengthCalibrations": True,
                "deckCalibration": True,
                "runsHistory": True,
                "authorizedKeys": True,
                # TODO(mm, 2023-08-04): Figure out how to test Flex-only options,
                # then add gripperOffsetCalibrations and onDeviceDisplay.
            },
            {
                ResetOptionId.boot_scripts,
                ResetOptionId.deck_calibration,
                ResetOptionId.pipette_offset,
                ResetOptionId.tip_length_calibrations,
                # TODO(mm, 2022-10-25): Verify that the subject endpoint function calls
                # PersistenceResetter.mark_directory_reset() and
                # DeckConfigurationStore.reset().
                # Currently blocked by those methods being async, and api_client having
                # its own event loop that interferes with making this test async.
                ResetOptionId.runs_history,
                ResetOptionId.authorized_keys,
            },
        ],
        [{"authorizedKeys": True}, {ResetOptionId.authorized_keys}],
        [{"bootScripts": True}, {ResetOptionId.boot_scripts}],
        [{"pipetteOffsetCalibrations": True}, {ResetOptionId.pipette_offset}],
        [{"tipLengthCalibrations": True}, {ResetOptionId.tip_length_calibrations}],
    ],
)
def test_reset_success(
    api_client,
    mock_reset,
    mock_persistence_resetter: PersistenceResetter,
    mock_images_resetter: ImagesResetter,
    mock_deck_configuration_store_failsafe: Optional[DeckConfigurationStore],
    body,
    called_with,
):
    resp = api_client.post("/settings/reset", json=body)
    assert resp.status_code == 200
    mock_reset.assert_called_once_with(called_with, RobotTypeEnum.OT2)


def test_reset_invalid_option(
    api_client,
    mock_reset,
    mock_persistence_resetter,
    mock_images_resetter,
    mock_deck_configuration_store_failsafe,
):
    resp = api_client.post("/settings/reset", json={"aksgjajhadjasl": False})
    assert resp.status_code == 422
    body = resp.json()
    assert "message" in body
    assert "Input should be" in body["message"]


def test_set_log_level_redirects(api_client):
    resp = api_client.post(
        "/settings/log_level/local",
        json={"log_level": "debug"},
        follow_redirects=False,
    )
    assert resp.status_code == 308
    assert resp.headers["location"] == "/system/settings/log_level/local"


@pytest.mark.parametrize(argnames=["disabled"], argvalues=[[True], [False]])
def test_set_status_bar_disabled(api_client, hardware, disabled):
    """Tests that the endpoint correctly updates the setting of the status bar in the API."""
    resp = api_client.post(
        "/settings", json={"id": "disableStatusBar", "value": disabled}
    )
    assert resp.status_code == 200
    hardware.set_status_bar_enabled.assert_called_once_with(not disabled)


@pytest.fixture
def mock_get_all_adv_settings():
    with patch(
        "robot_server.service.legacy.routers.settings.advanced_settings.get_all_adv_settings"
    ) as p:
        p.return_value = {
            s.id: advanced_settings.Setting(value=False, definition=s)
            for s in advanced_settings.settings
        }
        yield p


@pytest.fixture
def mock_is_restart_required():
    with patch(
        "robot_server.service.legacy.routers.settings.advanced_settings.is_restart_required"
    ) as p:
        yield p


@pytest.fixture
def mock_set_adv_setting():
    with patch(
        "robot_server.service.legacy.routers.settings.advanced_settings.set_adv_setting"
    ) as p:
        yield p


def validate_response_body(body, restart):
    settings_list = body.get("settings")
    assert isinstance(settings_list, list)
    for obj in settings_list:
        assert "id" in obj, '"id" field not found in settings object'
        assert "title" in obj, '"title" not found for {}'.format(obj["id"])
        assert "description" in obj, '"description" not found for {}'.format(obj["id"])
        assert "value" in obj, '"value" not found for {}'.format(obj["id"])
        assert "restart_required" in obj
    assert "links" in body
    assert isinstance(body["links"], dict)
    assert body["links"].get("restart") == restart


@pytest.mark.parametrize(
    argnames=["restart_required", "link"],
    argvalues=[[False, None], [True, "/server/restart"]],
)
def test_get(
    api_client,
    mock_get_all_adv_settings,
    mock_is_restart_required,
    restart_required,
    link,
):
    mock_is_restart_required.return_value = restart_required
    resp = api_client.get("/settings")
    body = resp.json()
    assert resp.status_code == 200
    validate_response_body(body, link)


@pytest.mark.parametrize(
    argnames=["exc", "expected_status", "message"],
    argvalues=[
        [ValueError("Failure"), 400, "ValueError: Failure"],
        [
            advanced_settings.SettingException("Fail", "e"),
            500,
            "opentrons.config.advanced_settings.SettingException: Fail",
        ],
    ],
)
def test_set_err(
    api_client,
    mock_is_restart_required,
    mock_set_adv_setting,
    exc,
    expected_status,
    message,
):
    mock_is_restart_required.return_value = False

    def raiser(i, v):
        raise exc

    mock_set_adv_setting.side_effect = raiser

    test_id = "disableHomeOnBoot"

    resp = api_client.post("/settings", json={"id": test_id, "value": True})
    body = resp.json()
    assert resp.status_code == expected_status
    assert body == {"message": message, "errorCode": "4000"}


def test_set(api_client, mock_set_adv_setting, mock_is_restart_required):
    mock_is_restart_required.return_value = False

    test_id = "disableHomeOnBoot"

    resp = api_client.post("/settings", json={"id": test_id, "value": True})
    body = resp.json()
    assert resp.status_code == 200
    validate_response_body(body, None)
    mock_set_adv_setting.assert_called_once_with(test_id, True)


def test_enable_hardware_subprocess_persists_without_live_transition(
    api_client, mock_set_adv_setting, mock_is_restart_required
):
    """Enabling Pyro must persist the flag even if subprocess hardware is not up."""
    mock_is_restart_required.return_value = True

    async def _flex_robot_type() -> RobotTypeEnum:
        return RobotTypeEnum.FLEX

    app.dependency_overrides[get_robot_type_enum] = _flex_robot_type
    try:
        resp = api_client.post(
            "/settings", json={"id": "enableHardwareSubprocess", "value": True}
        )
    finally:
        del app.dependency_overrides[get_robot_type_enum]

    assert resp.status_code == 200
    mock_set_adv_setting.assert_called_once_with("enableHardwareSubprocess", True)
