import pytest
from unittest.mock import patch

from opentrons.config import advanced_settings, CONFIG


@pytest.fixture
def mock_settings_values():
    return {s.id: False for s in advanced_settings.settings}


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


async def test_set_adv_setting(loop,
                               mock_read_settings_file,
                               mock_settings_values,
                               mock_write_settings_file,
                               mock_settings_version,
                               restore_restart_required):
    for k, v in mock_settings_values.items():
        # Toggle the advanced setting
        await advanced_settings.set_adv_setting(k, not v)
        mock_write_settings_file.assert_called_with(
            # Only the current key is toggled
            {nk: nv if nk != k else not v
             for nk, nv in mock_settings_values.items()},
            mock_settings_version,
            CONFIG['feature_flags_file']
        )


async def test_set_adv_setting_unknown(loop,
                                       mock_read_settings_file,
                                       mock_write_settings_file):
    mock_read_settings_file.return_value = \
        advanced_settings.SettingsData({}, 1)
    with pytest.raises(ValueError, match="is not recognized"):
        await advanced_settings.set_adv_setting("no", False)


async def test_on_change_called(loop,
                                mock_read_settings_file,
                                mock_settings_values,
                                mock_write_settings_file,
                                restore_restart_required):
    _id = 'useProtocolApi2'
    with patch(
        "opentrons.config.advanced_settings.SettingDefinition.on_change"
    ) as m:
        async def on_change(v):
            pass
        m.side_effect = on_change
        await advanced_settings.set_adv_setting(_id, True)
        m.assert_called_once_with(True)


async def test_restart_required(loop, restore_restart_required):
    assert advanced_settings.restart_required() is False
    _id = 'useFastApi'
    await advanced_settings.set_adv_setting(_id, True)
    assert advanced_settings.restart_required() is True


def test_get_setting_use_env_overload(mock_read_settings_file,
                                      mock_settings_values):
    with patch("os.environ",
               new={
                   "OT_API_FF_useProtocolApi2": "TRUE"
               }):
        v = advanced_settings.get_setting_with_env_overload("useProtocolApi2")
        assert v is not mock_settings_values['useProtocolApi2']


def test_get_setting_with_env_overload(mock_read_settings_file,
                                       mock_settings_values):
    with patch("os.environ",
               new={}):
        v = advanced_settings.get_setting_with_env_overload("useProtocolApi2")
        assert v is mock_settings_values['useProtocolApi2']


@pytest.mark.parametrize(argnames=["v", "expected_level"],
                         argvalues=[
                             [True, "emerg"],
                             [False, "info"],
                         ])
async def test_disable_log_integration_side_effect(loop,
                                                   v,
                                                   expected_level):
    with patch("opentrons.config.advanced_settings.log_control") \
            as mock_log_control:
        async def set_syslog_level(level):
            return 0, "", ""

        mock_log_control.set_syslog_level.side_effect = set_syslog_level
        with patch("opentrons.config.advanced_settings.ARCHITECTURE",
                   new=advanced_settings.ARCHITECTURE.BUILDROOT):
            s = advanced_settings.DisableLogIntegrationSettingDefinition()
            await s.on_change(v)
            mock_log_control.set_syslog_level.assert_called_once_with(
                expected_level
            )


async def test_disable_log_integration_side_effect_error(loop):
    with patch("opentrons.config.advanced_settings.log_control") \
            as mock_log_control:
        async def set_syslog_level(level):
            return 1, "", ""

        mock_log_control.set_syslog_level.side_effect = set_syslog_level
        with patch("opentrons.config.advanced_settings.ARCHITECTURE",
                   new=advanced_settings.ARCHITECTURE.BUILDROOT):
            s = advanced_settings.DisableLogIntegrationSettingDefinition()
            with pytest.raises(advanced_settings.SettingException):
                await s.on_change(True)
