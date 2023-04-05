"""Data for hardware-testing."""
from datetime import datetime
import os
from pathlib import Path
from subprocess import check_output
from time import time
from typing import Tuple

from opentrons.config import infer_config_base_dir, IS_ROBOT

GIT_DESCRIBE_NAME = ".hardware-testing-description"


def _git(*args: str) -> str:
    return check_output(["git"] + list(args)).decode("utf-8").strip()


def _build_git_description_string() -> str:
    if IS_ROBOT:
        raise RuntimeError("unable to run git describe on robot")
    description = _git("describe")
    mods = _git("ls-files", "-m").replace("\n", ", ")
    if not mods:
        return description
    return f"{description} [{mods}]"


def get_git_description() -> str:
    """Get git description file."""
    if IS_ROBOT:
        file_path = infer_config_base_dir() / GIT_DESCRIBE_NAME
        if not file_path.exists():
            return "unknown"
        with open(file_path, "r") as f:
            return f.read().strip()
    else:
        return _build_git_description_string()


def create_git_description_file() -> str:
    """Create git description file."""
    if IS_ROBOT:
        raise RuntimeError("unable to create git description file on robot")
    contents = _build_git_description_string()
    file_path = infer_config_base_dir() / GIT_DESCRIBE_NAME
    with open(GIT_DESCRIBE_NAME, "w+") as f:
        f.write(contents)
    return str(file_path)


def get_testing_data_directory() -> Path:
    """Get testing_data directory."""
    if "TESTING_DATA_DIR" in os.environ:
        return Path(os.environ["TESTING_DATA_DIR"])
    return infer_config_base_dir() / "testing_data"


def _initialize_testing_data_base_dir() -> Path:
    base = get_testing_data_directory()
    base.mkdir(parents=True, exist_ok=True)
    return base


def create_test_name_from_file(f: str) -> str:
    """Create test name from file name."""
    return os.path.basename(f).replace("_", "-").replace(".py", "")


def create_folder_for_test_data(test_name: str) -> Path:
    """Create a folder for test data."""
    base = _initialize_testing_data_base_dir()
    test_path = base / test_name
    test_path.mkdir(parents=False, exist_ok=True)
    return test_path


def create_datetime_string() -> str:
    """Create datetime string."""
    return datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")


def create_run_id() -> str:
    """Create a run ID using datetime string."""
    return f"run-{create_datetime_string()}"


def create_run_id_and_start_time() -> Tuple[str, float]:
    """Create a run ID using datetime string."""
    return create_run_id(), time()


def create_file_name(
    test_name: str, run_id: str, tag: str, extension: str = "csv"
) -> str:
    """Create a file name, given a test name."""
    return f"{test_name}_{run_id}_{tag}.{extension}"


def _save_data(test_name: str, file_name: str, data: str, perm: str = "w+") -> Path:
    test_path = create_folder_for_test_data(test_name)
    data_path = test_path / file_name
    with open(data_path, perm) as f:
        f.write(data)
    return data_path


def dump_data_to_file(test_name: str, file_name: str, data: str) -> Path:
    """Save entire file contents to a file on disk."""
    return _save_data(test_name, file_name, data, perm="w+")


def append_data_to_file(test_name: str, file_name: str, data: str) -> Path:
    """Append new content to an already existing file on disk."""
    return _save_data(test_name, file_name, data, perm="a+")


def insert_data_to_file(test_name: str, file_name: str, data: str, line: int) -> None:
    """Insert new data at a specified line."""
    test_path = create_folder_for_test_data(test_name)
    data_path = test_path / file_name
    # read data from file, insert line, then overwrite previous file
    with open(data_path, "r") as f:
        contents = f.readlines()
    contents.insert(line, data)
    with open(data_path, "w") as f:
        f.write("".join(contents))
