import signal
import subprocess
import time
import sys
import tempfile
import os
import shutil
import json
import pathlib
import requests
import pytest

from datetime import datetime, timezone
from fastapi import routing
from mock import MagicMock
from starlette.testclient import TestClient
from typing import Any, Callable, Dict, Generator, Iterator, cast
from typing_extensions import NoReturn
from pathlib import Path
from sqlalchemy.engine import Engine

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons import config
from opentrons.hardware_control import API, HardwareControlAPI, ThreadedAsyncLock
from opentrons.protocols.context.protocol_api.labware import LabwareImplementation
from opentrons.calibration_storage import delete, modify, helpers
from opentrons.protocol_api import labware
from opentrons.types import Point, Mount
from opentrons.protocols.geometry.deck import Deck

from robot_server import app
from robot_server.hardware import get_hardware
from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE
from robot_server.service.session.manager import SessionManager
from robot_server.persistence.database import create_sql_engine

test_router = routing.APIRouter()


@test_router.get("/alwaysRaise")
async def always_raise() -> NoReturn:
    raise RuntimeError


app.include_router(test_router)


@pytest.fixture(autouse=True)
def configure_test_logs(caplog: pytest.LogCaptureFixture) -> None:
    """Configure which logs pytest captures and displays.

    Because of the autouse=True, this automatically applies to each test.

    By default, pytest displays log messages of level WARNING and above.
    If you need to adjust this in the course of a debugging adventure,
    you should normally do it by passing something like --log-level=DEBUG
    to pytest on the command line.
    """
    # Fix up SQLAlchemy's logging so that it uses the same log level as everything else.
    # By default, SQLAlchemy's logging is slightly unusual: it hides messages below
    # WARNING, even if you pass --log-level=DEBUG to pytest on the command line.
    # See: https://docs.sqlalchemy.org/en/14/core/engines.html#configuring-logging
    caplog.set_level("NOTSET", logger="sqlalchemy")


@pytest.fixture
def unique_id() -> str:
    """Get a fake unique identifier.

    Override robot_server.service.dependencies.get_unique_id
    """
    return "unique-id"


@pytest.fixture
def current_time() -> datetime:
    """Get a fake current time.

    Override robot_server.service.dependencies.get_current_time
    """
    return datetime(year=2021, month=1, day=1, tzinfo=timezone.utc)


@pytest.fixture
def hardware() -> MagicMock:
    return MagicMock(spec=API)


@pytest.fixture
def override_hardware(hardware: MagicMock) -> Iterator[None]:
    async def get_hardware_override() -> HardwareControlAPI:
        """Override for get_hardware dependency"""
        return hardware

    app.dependency_overrides[get_hardware] = get_hardware_override
    yield
    del app.dependency_overrides[get_hardware]


@pytest.fixture
def api_client(override_hardware: None) -> TestClient:
    client = TestClient(app)
    client.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return client


@pytest.fixture
def api_client_no_errors(override_hardware: None) -> TestClient:
    """An API client that won't raise server exceptions.
    Use only to test 500 pages; never use this for other tests."""
    client = TestClient(app, raise_server_exceptions=False)
    client.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return client


@pytest.fixture(scope="session")
def request_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({API_VERSION_HEADER: LATEST_API_VERSION_HEADER_VALUE})
    return session


@pytest.fixture(scope="session")
def server_temp_directory() -> Iterator[str]:
    new_dir = tempfile.mkdtemp()
    os.environ["OT_API_CONFIG_DIR"] = new_dir
    config.reload()

    yield new_dir
    shutil.rmtree(new_dir)

    del os.environ["OT_API_CONFIG_DIR"]


@pytest.fixture(scope="session")
def run_server(
    request_session: requests.Session, server_temp_directory: str
) -> Iterator["subprocess.Popen[Any]"]:
    """Run the robot server in a background process."""
    # In order to collect coverage we run using `coverage`.
    # `-a` is to append to existing `.coverage` file.
    # `--source` is the source code folder to collect coverage stats on.
    with subprocess.Popen(
        [
            sys.executable,
            "-m",
            "coverage",
            "run",
            "-a",
            "--source",
            "robot_server",
            "-m",
            "uvicorn",
            "robot_server:app",
            "--host",
            "localhost",
            "--port",
            "31950",
        ],
        env={
            "OT_ROBOT_SERVER_DOT_ENV_PATH": "dev.env",
            "OT_API_CONFIG_DIR": server_temp_directory,
        },
        stdin=subprocess.DEVNULL,
        # The server will log to its stdout or stderr.
        # Let it inherit our stdout and stderr so pytest captures its logs.
        stdout=None,
        stderr=None,
    ) as proc:
        # Wait for a bit to get started by polling /health
        from requests.exceptions import ConnectionError

        while True:
            try:
                request_session.get("http://localhost:31950/health")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)
        request_session.post(
            "http://localhost:31950/robot/home", json={"target": "robot"}
        )
        yield proc
        proc.send_signal(signal.SIGTERM)
        proc.wait()


@pytest.fixture
def attach_pipettes(server_temp_directory: str) -> Iterator[None]:
    import json

    pipette = {"dropTipShake": True, "model": "p300_multi_v1"}

    pipette_dir_path = os.path.join(server_temp_directory, "pipettes")
    pipette_file_path = os.path.join(pipette_dir_path, "testpipette01.json")

    with open(pipette_file_path, "w") as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)


@pytest.fixture
def set_up_index_file_temporary_directory(server_temp_directory: str) -> None:
    delete.clear_calibrations()
    deck = Deck()
    labware_list = [
        "nest_96_wellplate_2ml_deep",
        "corning_384_wellplate_112ul_flat",
        "geb_96_tiprack_1000ul",
        "nest_12_reservoir_15ml",
        "opentrons_96_tiprack_10ul",
    ]
    for idx, name in enumerate(labware_list):
        parent = deck.position_for(idx + 1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(implementation=LabwareImplementation(definition, parent))
        labware.save_calibration(lw, Point(0, 0, 0))


@pytest.fixture
def set_up_pipette_offset_temp_directory(server_temp_directory: str) -> None:
    attached_pip_list = ["123", "321"]
    mount_list = [Mount.LEFT, Mount.RIGHT]
    definition = labware.get_labware_definition("opentrons_96_filtertiprack_200ul")
    def_hash = helpers.hash_labware_def(definition)
    for pip, mount in zip(attached_pip_list, mount_list):
        modify.save_pipette_calibration(
            offset=Point(0, 0, 0),
            pip_id=pip,
            mount=mount,
            tiprack_hash=def_hash,
            tiprack_uri="opentrons/opentrons_96_filtertiprack_200ul/1",
        )


@pytest.fixture
def set_up_tip_length_temp_directory(server_temp_directory: str) -> None:
    attached_pip_list = ["123", "321"]
    tip_length_list = [30.5, 31.5]
    definition = labware.get_labware_definition("opentrons_96_filtertiprack_200ul")
    def_hash = helpers.hash_labware_def(definition)
    for pip, tip_len in zip(attached_pip_list, tip_length_list):
        cal: Dict[str, Any] = {
            def_hash: {"tipLength": tip_len, "lastModified": datetime.now()}
        }
        modify.save_tip_length_calibration(pip, cal)


@pytest.fixture
def set_up_deck_calibration_temp_directory(server_temp_directory: str) -> None:
    attitude = [[1.0008, 0.0052, 0.0], [-0.0, 0.992, 0.0], [0.0, 0.0, 1.0]]
    modify.save_robot_deck_attitude(attitude, "pip_1", "fakehash")


@pytest.fixture
def session_manager(hardware: HardwareControlAPI) -> SessionManager:
    return SessionManager(
        hardware=hardware,
        motion_lock=ThreadedAsyncLock(),
    )


@pytest.fixture
def set_disable_fast_analysis(
    request_session: requests.Session,
) -> Iterator[None]:
    """For integration tests that need to set then clear the
    enableHttpProtocolSessions feature flag"""
    url = "http://localhost:31950/settings"
    data = {"id": "disableFastProtocolUpload", "value": True}
    request_session.post(url, json=data)
    yield None
    data["value"] = None
    request_session.post(url, json=data)


@pytest.fixture
def get_labware_fixture() -> Callable[[str], LabwareDefinition]:
    def _get_labware_fixture(fixture_name: str) -> LabwareDefinition:
        with open(
            (
                pathlib.Path(__file__).parent
                / ".."
                / ".."
                / "shared-data"
                / "labware"
                / "fixtures"
                / "2"
                / f"{fixture_name}.json"
            ),
            "rb",
        ) as f:
            return cast(LabwareDefinition, json.loads(f.read().decode("utf-8")))

    return _get_labware_fixture


@pytest.fixture
def minimal_labware_def() -> LabwareDefinition:
    return {
        "metadata": {
            "displayName": "minimal labware",
            "displayCategory": "other",
            "displayVolumeUnits": "mL",
        },
        "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
        "parameters": {
            "isTiprack": False,
            "loadName": "minimal_labware_def",
            "isMagneticModuleCompatible": True,
            "quirks": ["a quirk"],
            "format": "irregular",
        },
        "ordering": [["A1"], ["A2"]],
        "wells": {
            "A1": {
                "depth": 40,
                "totalLiquidVolume": 100,
                "diameter": 30,
                "x": 0,
                "y": 0,
                "z": 0,
                "shape": "circular",
            },
            "A2": {
                "depth": 40,
                "totalLiquidVolume": 100,
                "diameter": 30,
                "x": 10,
                "y": 0,
                "z": 0,
                "shape": "circular",
            },
        },
        "dimensions": {"xDimension": 1.0, "yDimension": 2.0, "zDimension": 3.0},
        "groups": [],
        "brand": {"brand": "opentrons"},
        "version": 1,
        "schemaVersion": 2,
        "namespace": "opentronstest",
    }


@pytest.fixture
def custom_tiprack_def() -> LabwareDefinition:
    return {
        "metadata": {"displayName": "minimal labware"},
        "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
        "parameters": {
            "isTiprack": True,
            "tipLength": 55.3,
            "tipOverlap": 2.8,
            "loadName": "minimal_labware_def",
        },
        "ordering": [["A1"], ["A2"]],
        "wells": {
            "A1": {
                "depth": 40,
                "totalLiquidVolume": 100,
                "diameter": 30,
                "x": 0,
                "y": 0,
                "z": 0,
                "shape": "circular",
            },
            "A2": {
                "depth": 40,
                "totalLiquidVolume": 100,
                "diameter": 30,
                "x": 10,
                "y": 0,
                "z": 0,
                "shape": "circular",
            },
        },
        "groups": [
            {
                "wells": ["A1", "A2"],
                "metadata": {},
            }
        ],
        "dimensions": {"xDimension": 1.0, "yDimension": 2.0, "zDimension": 3.0},
        "namespace": "custom",
        "version": 1,
        "schemaVersion": 2,
        "brand": {"brand": "Opentrons"},
    }


@pytest.fixture
def clear_custom_tiprack_def_dir() -> Iterator[None]:
    tiprack_path = (
        config.get_custom_tiprack_def_path() / "custom/minimal_labware_def/1.json"
    )
    try:
        os.remove(tiprack_path)
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(tiprack_path)
    except FileNotFoundError:
        pass


@pytest.fixture
def sql_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    """Return a set-up database to back the store."""
    db_file_path = tmp_path / "test.db"
    sql_engine = create_sql_engine(db_file_path)
    yield sql_engine
    sql_engine.dispose()
