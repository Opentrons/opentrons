"""Tests for the /health router."""

from pathlib import Path
from typing import Dict, Iterator

import pytest
from decoy import Decoy
from mock import MagicMock, patch

from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MIN_SUPPORTED_VERSION
from opentrons_shared_data.robot.types import RobotType

from robot_server.disk_monitor.models import DiskDetails
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.health.router import (
    ComponentVersions,
    _get_version,
    get_health,
    get_versions,
)


@pytest.fixture
def images_directory(tmp_path: Path) -> Path:
    """Return a directory for storing camera capture files."""
    subdirectory = tmp_path / "images"
    subdirectory.mkdir()
    return subdirectory


@pytest.fixture
def disk_monitor(decoy: Decoy) -> DiskMonitor:
    """Get a mocked out DiskMonitor interface."""
    mock = decoy.mock(cls=DiskMonitor)
    decoy.when(mock.get_details()).then_return(
        DiskDetails(
            systemAvailableMb=1000.0,
            systemTotalMb=5000.0,
            imagesDirectorySizeMb=500.0,
            runStartLimitFreeSpaceMb=100.0,
            isDiskSpaceBelowRunStartLimit=True,
        )
    )
    return mock


async def test_get_health(
    hardware: MagicMock,
    disk_monitor: DiskMonitor,
    images_directory: Path,
) -> None:
    """Test get_health function."""
    hardware.fw_version = "FW111"
    hardware.board_revision = "BR2.1"
    hardware.get_serial_number.return_value = "mytestserial"

    versions = ComponentVersions(
        api_version="mytestapiversion", system_version="mytestsystemversion"
    )

    robot_type: RobotType = "OT-2 Standard"

    result = await get_health(
        hardware=hardware,
        sql_engine=MagicMock(),
        versions=versions,
        robot_type=robot_type,
        disk_monitor=disk_monitor,
    )

    expected = {
        "name": "opentrons-dev",
        "api_version": "mytestapiversion",
        "fw_version": "FW111",
        "board_revision": "BR2.1",
        "logs": [
            "/logs/serial.log",
            "/logs/api.log",
            "/logs/server.log",
            "/logs/update_server.log",
        ],
        "system_version": "mytestsystemversion",
        "minimum_protocol_api_version": list(MIN_SUPPORTED_VERSION),
        "maximum_protocol_api_version": list(MAX_SUPPORTED_VERSION),
        "robot_model": "OT-2 Standard",
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "serverLog": "/logs/server.log",
            "apiSpec": "/openapi.json",
            "systemTime": "/system/time",
        },
        "robot_serial": "mytestserial",
        "disk_details": {
            "systemAvailableMb": 1000.0,
            "systemTotalMb": 5000.0,
            "imagesDirectorySizeMb": 500.0,
            "runStartLimitFreeSpaceMb": 100.0,
            "isDiskSpaceBelowRunStartLimit": True,
        },
    }

    assert result.model_dump(mode="json", exclude_none=True) == expected


async def test_get_health_with_none_version(
    hardware: MagicMock,
    disk_monitor: DiskMonitor,
    images_directory: Path,
) -> None:
    """Test get_health function with no serial number."""
    hardware.fw_version = "FW111"
    hardware.board_revision = "BR2.1"
    hardware.get_serial_number.return_value = None

    versions = ComponentVersions(
        api_version="mytestapiversion", system_version="mytestsystemversion"
    )

    robot_type: RobotType = "OT-2 Standard"

    result = await get_health(
        hardware=hardware,
        sql_engine=MagicMock(),
        versions=versions,
        robot_type=robot_type,
        disk_monitor=disk_monitor,
    )

    expected = {
        "name": "opentrons-dev",
        "api_version": "mytestapiversion",
        "fw_version": "FW111",
        "board_revision": "BR2.1",
        "logs": [
            "/logs/serial.log",
            "/logs/api.log",
            "/logs/server.log",
            "/logs/update_server.log",
        ],
        "system_version": "mytestsystemversion",
        "minimum_protocol_api_version": list(MIN_SUPPORTED_VERSION),
        "maximum_protocol_api_version": list(MAX_SUPPORTED_VERSION),
        "robot_model": "OT-2 Standard",
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "serverLog": "/logs/server.log",
            "apiSpec": "/openapi.json",
            "systemTime": "/system/time",
        },
        "disk_details": {
            "systemAvailableMb": 1000.0,
            "systemTotalMb": 5000.0,
            "imagesDirectorySizeMb": 500.0,
            "runStartLimitFreeSpaceMb": 100.0,
            "isDiskSpaceBelowRunStartLimit": True,
        },
    }

    assert result.model_dump(mode="json", exclude_none=True) == expected


@pytest.fixture
def mock_version_file_contents() -> Iterator[MagicMock]:
    """Returns a mock for version file contents."""
    with patch("robot_server.health.router._get_version", spec=_get_version) as p:
        p.return_value = {}
        yield p


@pytest.fixture
def mock_config_version() -> Iterator[MagicMock]:
    """Returns a mock for the config version."""
    with patch("robot_server.health.router._get_config_system_version") as p:
        p.return_value = "mysystemversion"
        yield p


@pytest.fixture
def mock_api_version() -> Iterator[MagicMock]:
    """Returns a mock for the api version."""
    with patch("robot_server.health.router._get_api_version_dunder") as p:
        p.return_value = "myapiversion"
        yield p


@pytest.mark.parametrize(
    "file_contents,config_system_version,api_version,computed_version",
    [
        (
            {},
            "rightsystemversion",
            "rightapiversion",
            ComponentVersions("rightapiversion", "rightsystemversion"),
        ),
        (
            {"opentrons_api_version": "fileapiversion"},
            "rightsystemversion",
            "wrongapiversion",
            ComponentVersions("fileapiversion", "rightsystemversion"),
        ),
        (
            {"buildroot_version": "filesystemversion"},
            "wrongsystemversion",
            "rightapiversion",
            ComponentVersions("rightapiversion", "filesystemversion"),
        ),
        (
            {"openembedded_version": "filesystemversion"},
            "wrongsystemversion",
            "rightapiversion",
            ComponentVersions("rightapiversion", "filesystemversion"),
        ),
        (
            {
                "opentrons_api_version": "fileapiversion",
                "buildroot_version": "filesystemversion",
            },
            "wrongsystemversion",
            "wrongapiversion",
            ComponentVersions("fileapiversion", "filesystemversion"),
        ),
        (
            {
                "opentrons_api_version": "fileapiversion",
                "openembedded_version": "filesystemversion",
            },
            "wrongsystemversion",
            "wrongapiversion",
            ComponentVersions("fileapiversion", "filesystemversion"),
        ),
    ],
)
async def test_version_dependency(
    file_contents: Dict[str, str],
    config_system_version: str,
    api_version: str,
    computed_version: ComponentVersions,
    mock_version_file_contents: MagicMock,
    mock_config_version: MagicMock,
    mock_api_version: MagicMock,
) -> None:
    """Tests whether the version dependency function works."""
    mock_version_file_contents.return_value = file_contents
    mock_config_version.return_value = config_system_version
    mock_api_version.return_value = api_version
    assert (await get_versions()) == computed_version
