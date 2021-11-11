from typing import Dict, Optional

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from opentrons.config.advanced_settings import _migrate, _ensure


@pytest.fixture
def migrated_file_version() -> int:
    return 11


@pytest.fixture
def default_file_settings() -> Dict[str, Optional[bool]]:
    return {
        "shortFixedTrash": None,
        "calibrateToBottom": None,
        "deckCalibrationDots": None,
        "disableHomeOnBoot": None,
        "useOldAspirationFunctions": None,
        "disableLogAggregation": None,
        "enableDoorSafetySwitch": None,
        "enableHttpProtocolSessions": None,
        "disableFastProtocolUpload": None,
        "enableOT3HardwareController": None,
    }


@pytest.fixture
def empty_settings():
    return {}


@pytest.fixture
def version_less():
    return {
        "shortFixedTrash": True,
        "calibrateToBottom": True,
        "deckCalibrationDots": True,
        "disableHomeOnBoot": True,
        "useOldAspirationFunctions": True,
    }


@pytest.fixture
def v1_config():
    return {
        "_version": 1,
        "shortFixedTrash": True,
        "calibrateToBottom": True,
        "deckCalibrationDots": True,
        "disableHomeOnBoot": True,
        "useProtocolApi2": None,
        "useOldAspirationFunctions": True,
    }


@pytest.fixture
def v2_config(v1_config):
    r = v1_config.copy()
    r.update(
        {
            "_version": 2,
            "disableLogAggregation": True,
        }
    )
    return r


@pytest.fixture
def v3_config(v2_config):
    r = v2_config.copy()
    r.update({"_version": 3, "enableApi1BackCompat": False})
    return r


@pytest.fixture
def v4_config(v3_config):
    r = v3_config.copy()
    r.update({"_version": 4, "useV1HttpApi": False})
    return r


@pytest.fixture
def v5_config(v4_config):
    r = v4_config.copy()
    r.update(
        {
            "_version": 5,
            "enableDoorSafetySwitch": True,
        }
    )
    return r


@pytest.fixture
def v6_config(v5_config):
    r = v5_config.copy()
    r.update(
        {
            "_version": 6,
            "enableTipLengthCalibration": True,
        }
    )
    return r


@pytest.fixture
def v7_config(v6_config):
    r = v6_config.copy()
    r.update(
        {
            "_version": 7,
            "enableHttpProtocolSessions": True,
        }
    )
    return r


@pytest.fixture
def v8_config(v7_config):
    r = v7_config.copy()
    r.update(
        {
            "_version": 8,
            "enableFastProtocolUpload": True,
        }
    )
    return r


@pytest.fixture
def v9_config(v8_config):
    r = v8_config.copy()
    r.update(
        {
            "_version": 9,
            "enableProtocolEngine": True,
        }
    )
    return r


@pytest.fixture
def v10_config(v9_config):
    r = v9_config.copy()
    r.pop("useProtocolApi2")
    r.pop("enableApi1BackCompat")
    r.pop("useV1HttpApi")
    r.pop("enableTipLengthCalibration")
    r.pop("enableFastProtocolUpload")
    r.update(
        {
            "_version": 10,
            "disableFastProtocolUpload": True,
        }
    )
    return r


@pytest.fixture
def v11_config(v10_config):
    r = v10_config.copy()
    r.pop("enableProtocolEngine")
    r.update({"_version": 11})
    return r


@pytest.fixture
def v12_config(v11_config):
    r = v11_config.copy()
    r.update(
        {
            "_version": 12,
            "enableOT3HardwareController": True,
        }
    )
    return r


@pytest.fixture(
    scope="session",
    params=[
        lazy_fixture("empty_settings"),
        lazy_fixture("version_less"),
        lazy_fixture("v1_config"),
        lazy_fixture("v2_config"),
        lazy_fixture("v3_config"),
        lazy_fixture("v4_config"),
        lazy_fixture("v5_config"),
        lazy_fixture("v6_config"),
        lazy_fixture("v7_config"),
        lazy_fixture("v8_config"),
        lazy_fixture("v9_config"),
        lazy_fixture("v10_config"),
        lazy_fixture("v11_config"),
        lazy_fixture("v12_config"),
    ],
)
def old_settings(request):
    return request.param


def test_migrations(old_settings, migrated_file_version, default_file_settings):
    settings, version = _migrate(old_settings)

    expected = default_file_settings.copy()
    expected.update(
        {
            k: v
            for k, v in old_settings.items()
            if k != "_version" and k in default_file_settings
        }
    )

    assert version == migrated_file_version
    assert settings == expected


def test_migrates_versionless_old_config(migrated_file_version, default_file_settings):
    settings, version = _migrate(
        {
            "short-fixed-trash": False,
            "calibrate-to-bottom": False,
            "dots-deck-type": True,
            "disable-home-on-boot": False,
        }
    )

    expected = default_file_settings.copy()
    expected.update(
        {
            "shortFixedTrash": None,
            "calibrateToBottom": None,
            "deckCalibrationDots": True,
            "disableHomeOnBoot": None,
        }
    )

    assert version == migrated_file_version
    assert settings == expected


def test_ignores_invalid_keys(migrated_file_version, default_file_settings):
    settings, version = _migrate(
        {
            "split-labware-def": True,
            "splitLabwareDefinitions": True,
        }
    )

    assert version == migrated_file_version
    assert settings == default_file_settings


def test_ensures_config():
    assert _ensure(
        {"_version": 3, "shortFixedTrash": False, "disableLogAggregation": True}
    ) == {
        "_version": 3,
        "shortFixedTrash": False,
        "calibrateToBottom": None,
        "deckCalibrationDots": None,
        "disableHomeOnBoot": None,
        "useOldAspirationFunctions": None,
        "disableLogAggregation": True,
        "enableDoorSafetySwitch": None,
        "enableHttpProtocolSessions": None,
        "disableFastProtocolUpload": None,
        "enableOT3HardwareController": None,
    }
