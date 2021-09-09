"""For pytest."""
import logging
import os
from pathlib import Path
from typing import Dict
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


@pytest.fixture(scope="session")
def test_protocols() -> Dict[str, Path]:
    """Provide a fixture with a dictionary of test protocol files."""
    # build this manually for now
    return {
        "python1": Path(
            Path(__file__).resolve().parent,
            "files/protocol/python1/test_drive.py",
        ),
    }
