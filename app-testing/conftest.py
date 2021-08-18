"""For pytest."""
import logging
import os
import shutil
from os import listdir
from os.path import isfile, join
from pathlib import Path
from typing import List
import pytest
from dotenv import load_dotenv, find_dotenv
from selenium.webdriver.chrome.options import Options

collect_ignore_glob = ["files/**/*.py"]

logger = logging.getLogger(__name__)

# Check to see if we have a dotenv file and use it
if find_dotenv():
    load_dotenv(find_dotenv())


@pytest.fixture(scope="function")
def chrome_options() -> Options:
    """Pass standard Chrome options to a test."""
    options = Options()
    executable_path = os.getenv("EXECUTABLE_PATH")
    assert (
        executable_path is not None
    ), "EXECUTABLE_PATH environment variable must be set"
    logger.info(f"EXECUTABLE_PATH is {executable_path}")
    options.binary_location = executable_path
    options.add_argument("whitelisted-ips=''")
    options.add_argument("disable-xss-auditor")
    options.add_argument("disable-web-security")
    options.add_argument("allow-running-insecure-content")
    options.add_argument("no-sandbox")
    options.add_argument("disable-setuid-sandbox")
    options.add_argument("disable-popup-blocking")
    options.add_argument("allow-elevated-browser")
    options.add_argument("verbose")
    return options


# not sure that moving these files into the robot config
# actually works to bootstrap calibration
@pytest.fixture(scope="function")
def emulated_robot_config() -> List[str]:
    """A fixture which will inject config files for the docker robot.

    This makes the docker robot think it is calibrated.
    """
    # delete and re-create the .opentrons_config directory
    # this conftest file is always one directory up
    # from the repository parent directory
    repo_home = Path(__file__).resolve().parents[1]
    config_dir = Path(repo_home, ".opentrons_config")
    if os.path.exists(config_dir):
        shutil.rmtree(config_dir)
    os.mkdir(config_dir)
    # get all of our robot config files and map them into .opentrons_config
    config_files_folder = Path(Path(__file__).resolve().parent, "files/config")
    config_files_paths = [
        file
        for file in listdir(config_files_folder)
        if isfile(join(config_files_folder, file))
    ]
    destination_paths: List[str] = []
    for path in config_files_paths:
        source_path = Path(config_files_folder, path)
        period_count = path.count(".")
        # periods are the delimiter in the filename for mapping into .opentrons_config
        # except for the last period which is for the file extension
        new_path = path.replace(".", "/", period_count - 1)
        destination_path = Path(config_dir, new_path)
        logger.debug(f"config file destination = {destination_path}")
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        shutil.copy(source_path, destination_path)
        destination_paths.append(destination_path)
    yield destination_paths
    # remove .opentrons_config
    if os.path.exists(config_dir):
        shutil.rmtree(config_dir)


@pytest.fixture(scope="session")
def test_protocols() -> dict:
    """Provide a fixture with a dictionary of test protocol files."""
    # build this manually for now
    return {
        "python1": Path(
            Path(__file__).resolve().parent,
            "files/protocol/python1/test_drive.py",
        ),
    }
