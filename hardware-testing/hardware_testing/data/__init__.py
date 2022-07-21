"""Data for hardware-testing."""
from datetime import datetime
import os
from pathlib import Path

from opentrons.config import infer_config_base_dir


def _infer_testing_data_base_dir() -> Path:
    if "TESTING_DATA_DIR" in os.environ:
        return Path(os.environ["TESTING_DATA_DIR"])
    return infer_config_base_dir() / "testing_data"


def _initialize_testing_data_base_dir() -> Path:
    base = _infer_testing_data_base_dir()
    base.mkdir(parents=True, exist_ok=True)
    return base


def create_folder_for_test_data(test_name: str) -> Path:
    """Create a folder for test data."""
    base = _initialize_testing_data_base_dir()
    test_path = base / test_name
    test_path.mkdir(parents=False, exist_ok=True)
    return test_path


def create_datetime_string() -> str:
    """Create a datetime string."""
    return datetime.now().strftime("%y%m%d%H%M%S")


def create_file_name(test_name: str, tag: str, extension: str = "csv") -> str:
    """Create a file name, given a test name."""
    return f"{test_name}_{tag}_{create_datetime_string()}.{extension}"


def _save_data(test_name: str, file_name: str, data: str, perm: str = "w+") -> None:
    test_path = create_folder_for_test_data(test_name)
    data_path = test_path / file_name
    with open(data_path, perm) as f:
        f.write(data)


def dump_data_to_file(test_name: str, file_name: str, data: str) -> None:
    """Save entire file contents to a file on disk."""
    return _save_data(test_name, file_name, data, perm="w+")


def append_data_to_file(test_name: str, file_name: str, data: str) -> None:
    """Append new content to an already existing file on disk."""
    return _save_data(test_name, file_name, data, perm="a+")
