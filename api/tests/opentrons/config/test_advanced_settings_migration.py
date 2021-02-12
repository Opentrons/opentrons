from typing import Dict, Optional

import pytest
from pytest_lazyfixture import lazy_fixture
from opentrons.config.advanced_settings import _migrate, _ensure


@pytest.fixture
def migrated_file_version() -> int:
    return 8


@pytest.fixture
def default_file_settings() -> Dict[str, Optional[bool]]:
    return {
        'shortFixedTrash': None,
        'calibrateToBottom': None,
        'deckCalibrationDots': None,
        'disableHomeOnBoot': None,
        'useOldAspirationFunctions': None,
        'disableLogAggregation': None,
        'enableApi1BackCompat': None,
        'useProtocolApi2': None,
        'useV1HttpApi': None,
        'enableDoorSafetySwitch': None,
        'enableTipLengthCalibration': None,
        'enableHttpProtocolSessions': None,
        'enableFastProtocolUpload': None,
    }


@pytest.fixture
def empty_settings():
    return {}


@pytest.fixture
def version_less():
    return {
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': True,
      'disableHomeOnBoot': True,
      'useOldAspirationFunctions': True,
    }


@pytest.fixture
def v1_config():
    return {
      '_version': 1,
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': True,
      'disableHomeOnBoot': True,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': True,
    }


@pytest.fixture
def v2_config(v1_config):
    r = v1_config
    r.update({
        '_version': 2,
        'disableLogAggregation': True,
    })
    return r


@pytest.fixture
def v3_config(v2_config):
    r = v2_config
    r.update({
        '_version': 3,
        'enableApi1BackCompat': False
    })
    return r


@pytest.fixture
def v4_config(v3_config):
    r = v3_config
    r.update({
        '_version': 4,
        'useV1HttpApi': False
    })
    return r


@pytest.fixture
def v5_config(v4_config):
    r = v4_config
    r.update({
        '_version': 5,
        'enableDoorSafetySwitch': True,
    })
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
        lazy_fixture("v5_config")
    ]
)
def old_settings(request):
    return request.param


def test_migrations(
        old_settings, migrated_file_version, default_file_settings):
    settings, version = _migrate(old_settings)

    expected = default_file_settings
    expected.update({
        k: v for k, v in old_settings.items() if k != '_version'
    })

    assert version == migrated_file_version
    assert settings == expected


def test_migrates_versionless_old_config(
        migrated_file_version, default_file_settings):
    settings, version = _migrate({
      'short-fixed-trash': False,
      'calibrate-to-bottom': False,
      'dots-deck-type': True,
      'disable-home-on-boot': False,
    })

    expected = default_file_settings
    expected.update({
        'shortFixedTrash': None,
        'calibrateToBottom': None,
        'deckCalibrationDots': True,
        'disableHomeOnBoot': None,
    })

    assert version == migrated_file_version
    assert settings == expected


def test_ignores_invalid_keys(migrated_file_version, default_file_settings):
    settings, version = _migrate({
      'split-labware-def': True,
      'splitLabwareDefinitions': True
    })

    assert version == migrated_file_version
    assert settings == default_file_settings


def test_ensures_config(default_file_settings):
    assert _ensure(
        {'_version': 3,
         'shortFixedTrash': False,
         'disableLogAggregation': True})\
         == {
             '_version': 3,
             'shortFixedTrash': False,
             'calibrateToBottom': None,
             'deckCalibrationDots': None,
             'disableHomeOnBoot': None,
             'useOldAspirationFunctions': None,
             'disableLogAggregation': True,
             'useProtocolApi2': None,
             'enableDoorSafetySwitch': None,
             'enableTipLengthCalibration': None,
             'enableHttpProtocolSessions': None,
             'enableFastProtocolUpload': None,
         }
