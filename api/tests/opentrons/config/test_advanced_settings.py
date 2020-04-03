import pytest
from unittest.mock import patch

from opentrons.config import advanced_settings, CONFIG


@pytest.fixture
def mock_settings_values():
    return {
        "disableHomeOnBoot": True,
        "useOldAspirationFunctions": False,
        "useFastApi": False,
        "useProtocolApi2": True
    }


@pytest.fixture
def mock_settings_version():
    return 1


@pytest.fixture
def mock_read_settings_file(mock_settings_values, mock_settings_version):
    with patch("opentrons.config.advanced_settings._read_settings_file") as p:
        p.return_value = \
            advanced_settings.SettingsData(
                settings_map=mock_settings_values,
                version=mock_settings_version)
        yield p


@pytest.fixture
def mock_write_settings_file():
    with patch("opentrons.config.advanced_settings._write_settings_file") as p:
        yield p


@pytest.fixture
def restore_restart_required():
    yield
    advanced_settings._SETTINGS_RESTART_REQUIRED = False


def test_get_advanced_setting_not_found(mock_read_settings_file):
    assert advanced_settings.get_adv_setting("unknown") is None


def test_get_advanced_setting_found(mock_read_settings_file,
                                    mock_settings_values):
    for k, v in mock_settings_values.items():
        s = advanced_settings.get_adv_setting(k)
        assert s.value == v
        assert s.definition == \
            advanced_settings.settings_by_id[k]


def test_get_all_adv_settings(mock_read_settings_file,
                              mock_settings_values):
    s = advanced_settings.get_all_adv_settings()
    assert s.keys() == mock_settings_values.keys()
    for k, v in s.items():
        assert v.value == mock_settings_values[k]
        assert v.definition == \
            advanced_settings.settings_by_id[k]


def test_get_all_adv_settings_empty(mock_read_settings_file):
    mock_read_settings_file.return_value = \
        advanced_settings.SettingsData({}, 1)
    s = advanced_settings.get_all_adv_settings()
    assert s == {}


def test_set_adv_setting(mock_read_settings_file,
                         mock_settings_values,
                         mock_write_settings_file,
                         mock_settings_version,
                         restore_restart_required):
    for k, v in mock_settings_values.items():
        # Toggle the advanced setting
        advanced_settings.set_adv_setting(k, not v)
        mock_write_settings_file.assert_called_with(
            # Only the current key is toggled
            {nk: nv if nk != k else not v
             for nk, nv in mock_settings_values.items()},
            mock_settings_version,
            CONFIG['feature_flags_file']
        )


def test_set_adv_setting_unknown(mock_read_settings_file,
                                 mock_write_settings_file):
    mock_read_settings_file.return_value = \
        advanced_settings.SettingsData({}, 1)
    with pytest.raises(ValueError, match="is not recognized"):
        advanced_settings.set_adv_setting("no", False)


def test_on_change_called(mock_read_settings_file,
                          mock_settings_values,
                          mock_write_settings_file,
                          restore_restart_required):
    _id = 'useProtocolApi2'
    with patch(
        "opentrons.config.advanced_settings.SettingDefinition.on_change"
    ) as m:
        advanced_settings.set_adv_setting(_id, True)
        m.assert_called_once_with(True)


def test_restart_required(restore_restart_required):
    assert advanced_settings.restart_required() is False
    _id = 'useFastApi'
    advanced_settings.set_adv_setting(_id, True)
    assert advanced_settings.restart_required() is True
