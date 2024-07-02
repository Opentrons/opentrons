"""Test system resource tracker configuration."""

import os
import pytest
from pathlib import Path, PurePosixPath
import logging
from performance_metrics import SystemResourceTrackerConfiguration


@pytest.fixture
def mock_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    """Fixture to set mock environment variables."""
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_ENABLED", "true")
    monkeypatch.setenv(
        "OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS", "/opt/opentrons*,python3*"
    )
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL", "5.0")
    monkeypatch.setenv(
        "OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR", "/data/performance_metrics_data"
    )
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL", "DEBUG")


@pytest.fixture
def clear_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    """Fixture to clear environment variables."""
    monkeypatch.delenv("OT_SYSTEM_RESOURCE_TRACKER_ENABLED", raising=False)
    monkeypatch.delenv("OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS", raising=False)
    monkeypatch.delenv("OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL", raising=False)
    monkeypatch.delenv("OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR", raising=False)
    monkeypatch.delenv("OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL", raising=False)


@pytest.mark.usefixtures("mock_env_vars")
def test_parse_should_track() -> None:
    """Test parsing of the should track environment variable."""
    assert SystemResourceTrackerConfiguration.parse_should_track() is True


@pytest.mark.usefixtures("clear_env_vars")
def test_parse_should_track_missing(caplog: pytest.LogCaptureFixture) -> None:
    """Test parsing of the should track environment variable when it is missing.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_should_track() is None
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_ENABLED is not set. Using default value."
            in caplog.text
        )


@pytest.mark.usefixtures("mock_env_vars")
def test_parse_process_filters() -> None:
    """Test parsing of the process filters environment variable."""
    expected_filters = ("/opt/opentrons*", "python3*")
    assert (
        SystemResourceTrackerConfiguration.parse_process_filters() == expected_filters
    )


@pytest.mark.usefixtures("clear_env_vars")
def test_parse_process_filters_missing(caplog: pytest.LogCaptureFixture) -> None:
    """Test parsing of the process filters environment variable when it is missing.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_process_filters() is None
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS is not set. Using default value."
            in caplog.text
        )


def test_parse_process_filters_empty(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Test parsing of the process filters environment variable when it is empty.

    Args:
        monkeypatch (pytest.MonkeyPatch): Fixture to modify environment variables.
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS", "")
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_process_filters() is None
        assert (
            "OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS environment variable must be a comma-separated list of process names to monitor. Globbing is supported. Using default value."
            in caplog.text
        )


@pytest.mark.usefixtures("mock_env_vars")
def test_parse_refresh_interval() -> None:
    """Test parsing of the refresh interval environment variable."""
    assert SystemResourceTrackerConfiguration.parse_refresh_interval() == 5.0


@pytest.mark.usefixtures("clear_env_vars")
def test_parse_refresh_interval_missing(caplog: pytest.LogCaptureFixture) -> None:
    """Test parsing of the refresh interval environment variable when it is missing.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_refresh_interval() is None
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL is not set. Using default value."
            in caplog.text
        )


def test_parse_refresh_interval_too_small(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Test parsing of the refresh interval environment variable when it is too small.

    Args:
        monkeypatch (pytest.MonkeyPatch): Fixture to modify environment variables.
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL", "0.5")
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_refresh_interval() is None
        assert (
            "OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL environment variable must be greater than or equal to 1.0. Using default value."
            in caplog.text
        )


def test_parse_refresh_interval_non_numeric(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Test parsing of the refresh interval environment variable when it is not numeric.

    Args:
        monkeypatch (pytest.MonkeyPatch): Fixture to modify environment variables.
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL", "not_a_number")
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_refresh_interval() is None
        assert (
            "OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL environment variable must be a number. Using default value."
            in caplog.text
        )


@pytest.mark.usefixtures("mock_env_vars")
def test_parse_storage_dir() -> None:
    """Test parsing of the storage directory environment variable."""
    expected_path = PurePosixPath("/data/performance_metrics_data")
    assert SystemResourceTrackerConfiguration.parse_storage_dir() == expected_path


@pytest.mark.usefixtures("clear_env_vars")
def test_parse_storage_dir_missing(caplog: pytest.LogCaptureFixture) -> None:
    """Test parsing of the storage directory environment variable when it is missing.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_storage_dir() is None
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR is not set. Using default value."
            in caplog.text
        )


def test_parse_storage_dir_invalid(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Test parsing of the storage directory environment variable when it is invalid.

    Args:
        monkeypatch (pytest.MonkeyPatch): Fixture to modify environment variables.
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR", "relative/path")
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_storage_dir() is None
        assert (
            "OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR environment variable must be an absolute path to a directory.\nYou specified: relative/path.\nIs absolute: False.\nUsing default value."
            in caplog.text
        )


@pytest.mark.usefixtures("mock_env_vars")
def test_parse_logging_level() -> None:
    """Test parsing of the logging level environment variable."""
    assert SystemResourceTrackerConfiguration.parse_logging_level() == "DEBUG"


@pytest.mark.usefixtures("clear_env_vars")
def test_parse_logging_level_missing(caplog: pytest.LogCaptureFixture) -> None:
    """Test parsing of the logging level environment variable when it is missing.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_logging_level() is None
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL is not set. Using default value."
            in caplog.text
        )


def test_parse_logging_level_invalid(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Test parsing of the logging level environment variable when it is invalid.

    Args:
        monkeypatch (pytest.MonkeyPatch): Fixture to modify environment variables.
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    monkeypatch.setenv("OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL", "INVALID")
    with caplog.at_level(logging.WARNING):
        assert SystemResourceTrackerConfiguration.parse_logging_level() is None
        assert (
            "OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL environment variable must be one of ['CRITICAL', 'FATAL', 'ERROR', 'WARN', 'WARNING', 'INFO', 'DEBUG', 'NOTSET']. Using default value."
            in caplog.text
        )


@pytest.mark.usefixtures("mock_env_vars")
def test_from_env() -> None:
    """Test the creation of a SystemResourceTrackerConfiguration object from environment variables."""
    config = SystemResourceTrackerConfiguration.from_env()
    assert config.should_track is True
    assert config.process_filters == ("/opt/opentrons*", "python3*")
    assert config.refresh_interval == 5.0
    assert config.storage_dir == Path("/data/performance_metrics_data")
    assert config.logging_level == "DEBUG"


@pytest.mark.usefixtures("clear_env_vars")
def test_from_env_with_defaults(caplog: pytest.LogCaptureFixture) -> None:
    """Test the creation of a SystemResourceTrackerConfiguration object from environment variables with default values.

    Args:
        caplog (pytest.LogCaptureFixture): Fixture to capture log messages.
    """
    with caplog.at_level(logging.WARNING):
        config = SystemResourceTrackerConfiguration.from_env()
        assert config.should_track is False
        assert config.process_filters == ("/opt/opentrons*", "python3*")
        assert config.refresh_interval == 10.0
        assert config.storage_dir == Path("/data/performance_metrics_data")
        assert config.logging_level == "INFO"
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_ENABLED is not set. Using default value."
            in caplog.text
        )
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS is not set. Using default value."
            in caplog.text
        )
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL is not set. Using default value."
            in caplog.text
        )
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR is not set. Using default value."
            in caplog.text
        )
        assert (
            "Environment variable OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL is not set. Using default value."
            in caplog.text
        )


def test_to_env() -> None:
    """Test the conversion of a SystemResourceTrackerConfiguration object to environment variables."""
    config = SystemResourceTrackerConfiguration(
        should_track=True,
        process_filters=("/opt/opentrons*", "python3*"),
        refresh_interval=5.0,
        storage_dir=Path("/data/performance_metrics_data"),
        logging_level="DEBUG",
    )
    config.to_env()
    assert os.environ["OT_SYSTEM_RESOURCE_TRACKER_ENABLED"] == "true"
    assert (
        os.environ["OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS"]
        == "/opt/opentrons*,python3*"
    )
    assert os.environ["OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL"] == "5.0"
    assert (
        os.environ["OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR"]
        == "/data/performance_metrics_data"
    )
    assert os.environ["OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL"] == "DEBUG"
