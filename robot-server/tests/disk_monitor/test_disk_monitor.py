"""Tests for the `DiskMonitor` class."""
import os
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.settings import RobotServerSettings


@pytest.fixture
def mock_settings() -> RobotServerSettings:
    """Mock settings with test values."""
    settings = Mock(spec=RobotServerSettings)
    settings.system_low_space_threshold_mb = 1000.0
    settings.images_directory_max_size_mb = 500.0
    return settings


@pytest.fixture
def images_directory(tmp_path: Path) -> Path:
    """Temporary images directory."""
    images_dir = tmp_path / "images"
    images_dir.mkdir()
    return images_dir


@pytest.fixture
def subject(images_directory: Path, mock_settings: RobotServerSettings) -> DiskMonitor:
    """Instance for testing."""
    return DiskMonitor(
        images_directory=images_directory,
        settings=mock_settings,
    )


def test_is_disk_space_low_when_below_threshold(subject: DiskMonitor) -> None:
    """It should return True when available space is below threshold."""
    with patch.object(subject, "get_available_disk_space_mb", return_value=500.0):
        assert subject.is_disk_space_low() is True


def test_is_disk_space_low_when_above_threshold(subject: DiskMonitor) -> None:
    """It should return False when available space is above threshold."""
    with patch.object(subject, "get_available_disk_space_mb", return_value=1500.0):
        assert subject.is_disk_space_low() is False


def test_get_images_directory_size_mb_with_files(
    images_directory: Path, subject: DiskMonitor
) -> None:
    """It should calculate total size of files in directory."""
    (images_directory / "file1.txt").write_text("a" * 1024)
    (images_directory / "file2.txt").write_text("b" * 2048)

    size_mb = subject.get_images_directory_size_mb()

    assert size_mb == pytest.approx(3072 / (1024 * 1024))


def test_get_images_directory_size_mb_with_subdirectories(
    images_directory: Path, subject: DiskMonitor
) -> None:
    """It should calculate total size including files in subdirectories."""
    (images_directory / "file1.txt").write_text("a" * 1024)

    subdir = images_directory / "subdir"
    subdir.mkdir()
    (subdir / "file2.txt").write_text("b" * 2048)

    size_mb = subject.get_images_directory_size_mb()

    assert size_mb == pytest.approx(3072 / (1024 * 1024))


def test_get_images_directory_size_mb_handles_os_errors(
    images_directory: Path, subject: DiskMonitor
) -> None:
    """It should continue gracefully if OSError occurs during file access."""
    (images_directory / "file1.txt").write_text("a" * 1024)
    (images_directory / "file2.txt").write_text("b" * 2048)

    original_getsize = os.path.getsize

    def mock_getsize(path: str) -> int:
        if "file1.txt" in path:
            raise OSError("Permission denied")
        return original_getsize(path)

    with patch("os.path.getsize", side_effect=mock_getsize):
        size_mb = subject.get_images_directory_size_mb()

        assert size_mb == pytest.approx(2048 / (1024 * 1024), rel=0.01)


def test_is_images_directory_over_limit_when_below_limit(
    subject: DiskMonitor,
) -> None:
    """It should return False when directory size is below limit."""
    with patch.object(subject, "get_images_directory_size_mb", return_value=300.0):
        assert subject.is_images_directory_over_limit() is False


def test_is_images_directory_over_limit_when_above_limit(
    subject: DiskMonitor,
) -> None:
    """It should return True when directory size exceeds limit."""
    with patch.object(subject, "get_images_directory_size_mb", return_value=600.0):
        assert subject.is_images_directory_over_limit() is True
