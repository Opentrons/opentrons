import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from typing import Any, Dict, Generator, Optional, Tuple
from unittest.mock import MagicMock, patch

from opentrons.config import advanced_settings, ARCHITECTURE, CONFIG
from opentrons_shared_data.robot.dev_types import RobotTypeEnum


@pytest.fixture
def mock_settings_values_ot2() -> Dict[str, Optional[bool]]:
    return {
        s.id: False
        for s in advanced_settings.settings
        if RobotTypeEnum.OT2 in s.robot_type and not s.internal_only
    }


@pytest.fixture
def mock_settings_values_ot2_all() -> Dict[str, Optional[bool]]:
    return {
        s.id: False
        for s in advanced_settings.settings
        if RobotTypeEnum.OT2 in s.robot_type
    }


@pytest.fixture
def mock_settings_values_flex() -> Dict[str, Optional[bool]]:
    return {
        s.id: False
        for s in advanced_settings.settings
        if RobotTypeEnum.FLEX in s.robot_type and not s.internal_only
    }


@pytest.fixture
def mock_settings_version() -> int:
    return 1


@pytest.fixture
def mock_settings(
    mock_settings_values_ot2: Dict[str, Optional[bool]],
    mock_settings_version: int,
) -> advanced_settings.SettingsData:
    return advanced_settings.SettingsData(
        settings_map=mock_settings_values_ot2,
        version=mock_settings_version,
    )


@pytest.fixture
def mock_read_settings_file_ot2(
    mock_settings_values_ot2: Dict[str, Optional[bool]],
    mock_settings_version: int,
) -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.advanced_settings._read_settings_file") as p:
        p.return_value = advanced_settings.SettingsData(
            settings_map=mock_settings_values_ot2,
            version=mock_settings_version,
        )
        yield p


@pytest.fixture
def mock_read_settings_file_flex(
    mock_settings_values_flex: Dict[str, Optional[bool]],
    mock_settings_version: int,
) -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.advanced_settings._read_settings_file") as p:
        p.return_value = advanced_settings.SettingsData(
            settings_map=mock_settings_values_flex,
            version=mock_settings_version,
        )
        yield p


@pytest.fixture
def mock_write_settings_file() -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.advanced_settings._write_settings_file") as p:
        yield p


@pytest.fixture
def restore_restart_required() -> Generator[None, None, None]:
    yield
    advanced_settings._SETTINGS_RESTART_REQUIRED = False


@pytest.fixture
def clear_cache() -> None:
    advanced_settings.get_all_adv_settings.cache_clear()


def test_get_advanced_setting_not_found(
    clear_cache: None, mock_read_settings_file_ot2: MagicMock
) -> None:
    assert advanced_settings.get_adv_setting("unknown", RobotTypeEnum.OT2) is None


def test_get_advanced_setting_found(
    clear_cache: None,
    mock_read_settings_file_ot2: MagicMock,
    mock_settings_values_ot2_all: Dict[str, Optional[bool]],
) -> None:
    for k, v in mock_settings_values_ot2_all.items():
        s = advanced_settings.get_adv_setting(k, RobotTypeEnum.OT2)
        assert s is not None
        assert s.value == v
        assert s.definition == advanced_settings.settings_by_id[k]


@pytest.mark.parametrize(
    "robot_type, mock_settings_values, mock_read_settings_file",
    [
        [
            RobotTypeEnum.OT2,
            lazy_fixture("mock_settings_values_ot2"),
            lazy_fixture("mock_read_settings_file_ot2"),
        ],
        [
            RobotTypeEnum.FLEX,
            lazy_fixture("mock_settings_values_flex"),
            lazy_fixture("mock_read_settings_file_flex"),
        ],
    ],
)
def test_get_all_adv_settings(
    clear_cache: None,
    mock_read_settings_file: MagicMock,
    mock_settings_values: MagicMock,
    robot_type: RobotTypeEnum,
) -> None:
    s = advanced_settings.get_all_adv_settings(robot_type)
    assert s.keys() == mock_settings_values.keys()
    for k, v in s.items():
        assert v.value == mock_settings_values[k]
        assert v.definition == advanced_settings.settings_by_id[k]


def test_get_all_adv_settings_empty(
    clear_cache: None,
    mock_read_settings_file_ot2: MagicMock,
) -> None:
    mock_read_settings_file_ot2.return_value = advanced_settings.SettingsData({}, 1)
    s = advanced_settings.get_all_adv_settings(RobotTypeEnum.OT2)
    assert s == {}


async def test_set_adv_setting(
    mock_read_settings_file_ot2: MagicMock,
    mock_settings_values_ot2: MagicMock,
    mock_write_settings_file: MagicMock,
    mock_settings_version: int,
    restore_restart_required: None,
) -> None:
    for k, v in mock_settings_values_ot2.items():
        # Toggle the advanced setting
        await advanced_settings.set_adv_setting(k, not v)
        mock_write_settings_file.assert_called_with(
            # Only the current key is toggled
            {
                nk: nv if nk != k else not v
                for nk, nv in mock_settings_values_ot2.items()
            },
            mock_settings_version,
            CONFIG["feature_flags_file"],
        )


async def test_set_adv_setting_unknown(
    mock_read_settings_file_ot2: MagicMock,
    mock_write_settings_file: MagicMock,
) -> None:
    mock_read_settings_file_ot2.return_value = advanced_settings.SettingsData({}, 1)
    with pytest.raises(ValueError, match="is not recognized"):
        await advanced_settings.set_adv_setting("no", False)


async def test_get_all_adv_settings_lru_cache(
    clear_cache: None,
    mock_read_settings_file_ot2: MagicMock,
    mock_write_settings_file: MagicMock,
) -> None:
    # Cache should not be used.
    advanced_settings.get_all_adv_settings(RobotTypeEnum.OT2)
    mock_read_settings_file_ot2.assert_called_once()
    mock_read_settings_file_ot2.reset_mock()
    # Should use cache
    advanced_settings.get_all_adv_settings(RobotTypeEnum.OT2)
    mock_read_settings_file_ot2.assert_not_called()
    mock_read_settings_file_ot2.reset_mock()
    # Updating will invalidate cache
    await advanced_settings.set_adv_setting("enableDoorSafetySwitch", True)
    mock_read_settings_file_ot2.reset_mock()
    # Cache should not be used
    advanced_settings.get_all_adv_settings(RobotTypeEnum.OT2)
    mock_read_settings_file_ot2.assert_called_once()
    mock_read_settings_file_ot2.reset_mock()
    # Should use cache
    advanced_settings.get_all_adv_settings(RobotTypeEnum.OT2)
    mock_read_settings_file_ot2.assert_not_called()


async def test_restart_required(
    restore_restart_required: None,
    mock_read_settings_file_ot2: MagicMock,
    mock_write_settings_file: MagicMock,
    mock_settings_version: int,
) -> None:
    _id = "restart_required"
    # Mock out the available settings
    available_settings = [
        advanced_settings.SettingDefinition(
            _id=_id,
            title="",
            description="",
            restart_required=True,
            robot_type=[RobotTypeEnum.OT2, RobotTypeEnum.FLEX],
        )
    ]
    with patch.object(advanced_settings, "settings", new=available_settings):
        # Mock out the settings_by_id
        available_settings_by_id = {s.id: s for s in available_settings}
        with patch.object(
            advanced_settings, "settings_by_id", new=available_settings_by_id
        ):
            mock_read_settings_file_ot2.return_value = advanced_settings.SettingsData(
                settings_map={_id: None}, version=mock_settings_version
            )

            assert advanced_settings.is_restart_required() is False
            await advanced_settings.set_adv_setting(_id, True)
            assert advanced_settings.is_restart_required() is True


@pytest.mark.parametrize(
    argnames=["v", "expected_level"],
    argvalues=[
        [True, "emerg"],
        [False, "info"],
    ],
)
async def test_disable_log_integration_side_effect(
    v: bool, expected_level: str
) -> None:
    with patch("opentrons.config.advanced_settings.log_control") as mock_log_control:

        async def set_syslog_level(level: Any) -> Tuple[int, str, str]:
            return 0, "", ""

        mock_log_control.set_syslog_level.side_effect = set_syslog_level
        with patch(
            "opentrons.config.advanced_settings.ARCHITECTURE",
            new=ARCHITECTURE.BUILDROOT,
        ):
            s = advanced_settings.DisableLogIntegrationSettingDefinition()
            await s.on_change(v)
            mock_log_control.set_syslog_level.assert_called_once_with(expected_level)


async def test_disable_log_integration_side_effect_error() -> None:
    with patch("opentrons.config.advanced_settings.log_control") as mock_log_control:

        async def set_syslog_level(level: Any) -> Tuple[int, str, str]:
            return 1, "", ""

        mock_log_control.set_syslog_level.side_effect = set_syslog_level
        with patch(
            "opentrons.config.advanced_settings.ARCHITECTURE",
            new=ARCHITECTURE.BUILDROOT,
        ):
            s = advanced_settings.DisableLogIntegrationSettingDefinition()
            with pytest.raises(advanced_settings.SettingException):
                await s.on_change(True)
