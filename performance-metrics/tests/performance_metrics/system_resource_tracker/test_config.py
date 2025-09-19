"""Test configuration parsing."""

import pytest
from pathlib import Path, PurePosixPath
from performance_metrics.system_resource_tracker._config import (
    _eval_enabled,
    _eval_process_filters,
    _eval_refresh_interval,
    _eval_storage_dir,
    _eval_logging_level,
    SystemResourceTrackerConfiguration,
    EnvironmentParseError,
    ENABLED_ENV_VAR_NAME,
    PROCESS_FILTERS_ENV_VAR_NAME,
    REFRESH_INTERVAL_ENV_VAR_NAME,
    STORAGE_DIR_ENV_VAR_NAME,
    LOGGING_LEVEL_ENV_VAR_NAME,
)


def test_eval_enabled() -> None:
    """Test parsing of the enabled environment variable."""
    assert _eval_enabled("true") is True
    assert _eval_enabled("false") is False
    with pytest.raises(EnvironmentParseError):
        _eval_enabled("invalid")


def test_eval_process_filters() -> None:
    """Test parsing of the process filters environment variable."""
    assert _eval_process_filters("python3, /opt/opentrons*") == (
        "python3",
        "/opt/opentrons*",
    )
    assert _eval_process_filters("python3") == ("python3",)
    with pytest.raises(EnvironmentParseError):
        _eval_process_filters("")


def test_eval_refresh_interval() -> None:
    """Test parsing of the refresh interval environment variable."""
    assert _eval_refresh_interval("10.5") == 10.5
    with pytest.raises(EnvironmentParseError):
        _eval_refresh_interval("invalid")
    with pytest.raises(EnvironmentParseError):
        _eval_refresh_interval("0.5")


def test_eval_storage_dir() -> None:
    """Test parsing of the storage directory environment variable."""
    assert _eval_storage_dir("/data/performance_metrics_data") == PurePosixPath(
        "/data/performance_metrics_data"
    )
    with pytest.raises(EnvironmentParseError):
        _eval_storage_dir("relative/path")


def test_eval_logging_level() -> None:
    """Test parsing of the logging level environment variable."""
    assert _eval_logging_level("INFO") == "INFO"
    assert _eval_logging_level("DEBUG") == "DEBUG"
    with pytest.raises(EnvironmentParseError):
        _eval_logging_level("INVALID")


def test_system_resource_tracker_configuration_from_env(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test creating a SystemResourceTrackerConfiguration instance from environment variables."""
    monkeypatch.setenv(ENABLED_ENV_VAR_NAME, "true")
    monkeypatch.setenv(PROCESS_FILTERS_ENV_VAR_NAME, "python3, /opt/opentrons")
    monkeypatch.setenv(REFRESH_INTERVAL_ENV_VAR_NAME, "10.5")
    monkeypatch.setenv(STORAGE_DIR_ENV_VAR_NAME, "/data/performance_metrics_data")
    monkeypatch.setenv(LOGGING_LEVEL_ENV_VAR_NAME, "INFO")

    config = SystemResourceTrackerConfiguration.from_env()

    assert config.enabled is True
    assert config.process_filters == ("python3", "/opt/opentrons")
    assert config.refresh_interval == 10.5
    assert config.storage_dir == Path("/data/performance_metrics_data")
    assert config.logging_level == "INFO"


def test_system_resource_tracker_configuration_from_env_defaults(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test creating a SystemResourceTrackerConfiguration instance with default values."""
    config = SystemResourceTrackerConfiguration.from_env()

    assert config.enabled is False
    assert config.process_filters == ("/opt/opentrons*", "python3*")
    assert config.refresh_interval == 10.0
    assert config.storage_dir == Path("/data/performance_metrics_data/")
    assert config.logging_level == "INFO"


def test_eval_enabled_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test handling of invalid should track environment variable."""
    monkeypatch.setenv(ENABLED_ENV_VAR_NAME, "invalid")
    with pytest.raises(EnvironmentParseError):
        SystemResourceTrackerConfiguration.from_env()


def test_eval_process_filters_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test handling of invalid process filters environment variable."""
    monkeypatch.setenv(PROCESS_FILTERS_ENV_VAR_NAME, "")
    with pytest.raises(EnvironmentParseError):
        SystemResourceTrackerConfiguration.from_env()


def test_eval_refresh_interval_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test handling of invalid refresh interval environment variable."""
    monkeypatch.setenv(REFRESH_INTERVAL_ENV_VAR_NAME, "invalid")
    with pytest.raises(EnvironmentParseError):
        SystemResourceTrackerConfiguration.from_env()


def test_eval_storage_dir_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test handling of invalid storage directory environment variable."""
    monkeypatch.setenv(STORAGE_DIR_ENV_VAR_NAME, "relative/path")
    with pytest.raises(EnvironmentParseError):
        SystemResourceTrackerConfiguration.from_env()


def test_eval_logging_level_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test handling of invalid logging level environment variable."""
    monkeypatch.setenv(LOGGING_LEVEL_ENV_VAR_NAME, "INVALID")
    with pytest.raises(EnvironmentParseError):
        SystemResourceTrackerConfiguration.from_env()
