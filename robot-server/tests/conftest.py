import inspect
import json
import os
import pathlib
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Callable, Generator, Iterator, cast

import pytest
from _pytest.mark import deselect_by_mark
from decoy import Decoy
from fastapi import routing
from mock import MagicMock
from sqlalchemy.engine import Engine as SQLEngine
from starlette.testclient import TestClient
from typing_extensions import NoReturn

from opentrons import config
from opentrons.calibration_storage import (
    helpers,
    save_robot_deck_attitude,
)

# NOTE(FS 10-24-2023), the fixtures using these functions currently ONLY
# get pulled in by OT-2 server tests. If this ever changes, we need to
# conditionally set up ot2/ot3 calibration structures instead of invariably
# calling the OT2 functions.
from opentrons.calibration_storage.ot2 import (
    create_tip_length_data,
    save_pipette_calibration,
    save_tip_length_calibration,
)
from opentrons.hardware_control import (
    API,
    HardwareControlAPI,
    ThreadedAsyncLock,
)
from opentrons.hardware_control import (
    types as hw_types,
)
from opentrons.protocol_api import labware
from opentrons.types import Mount, Point
from opentrons_shared_data.labware.types import LabwareDefinition
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.audit.audit_server import (
    AuditSettingsResponseData,
)
from server_utils.audit.audit_server import (
    Client as AuditClient,
)
from server_utils.audit.fastapi import get_audit_client, install_audit_client
from server_utils.auth.resource_server.authentication_checker import (
    AlwaysAllowedAuthenticationChecker,
    AuthenticationChecker,
)
from server_utils.auth.resource_server.fastapi import (
    get_authentication_checker,
)

from robot_server.app import app
from robot_server.hardware import HardwareStateStore, get_hardware, get_ot2_hardware
from robot_server.health.router import ComponentVersions, get_versions
from robot_server.persistence.database import sql_engine_ctx
from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import metadata
from robot_server.runs.dependencies import get_run_data_manager
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.service.notifications.notification_client import (
    NotificationClient,
    get_notification_client,
)
from robot_server.service.session.manager import SessionManager
from robot_server.versioning import API_VERSION_HEADER, LATEST_API_VERSION_HEADER_VALUE

test_router = routing.APIRouter()


@test_router.get("/alwaysRaise", response_model=None)
async def always_raise() -> NoReturn:
    raise RuntimeError


app.include_router(test_router)


def pytest_collection_modifyitems(
    session: pytest.Session, config: pytest.Config, items: list[pytest.Item]
) -> None:
    """Hook to implement not collecting integration tests if not needed.

    https://docs.pytest.org/en/stable/reference/reference.html#pytest.hookspec.pytest_collection_modifyitems

    The normal way to do this is to mark tests with a custom mark. But that's a lot of tests.
    The next way to do this is to apply a mark dynamically in a fixture (which we do below) but that
    happens after collection time, so we can only skip the tests rather than not collecting them.

    By writing a collection hook, we can skip collecting the tests altogether. We can do this by
    - At collection time, adding the mark to any test defined in a path under integration/
    - Make sure that we rerun the logic that discards tests if they don't match some mark expression

    Unfortunately that last part is a part of pytest internals, so we have to poke in there, but
    it's only one place so maybe it's okay. It also may not be necessary (because maybe pytest forces
    internal hooks to run after external hooks) but there's no formal guarantee that it isn't, so we do it.
    """
    for item in items:
        # https://docs.pytest.org/en/stable/reference/reference.html#pytest.Item.location
        itempath = item.location[0]
        if os.path.join("tests", "integration") in itempath:
            item.add_marker(pytest.mark.integration)
    # https://github.com/pytest-dev/pytest/blob/main/src/_pytest/mark/__init__.py#L255
    deselect_by_mark(items=items, config=config)


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Return a mock in the shape of a HardwareControlAPI."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    return decoy.mock(cls=API)


@pytest.fixture
async def hardware_state_store(hardware_api: HardwareControlAPI) -> HardwareStateStore:
    """Build a hardware state store on fixtured data."""
    return HardwareStateStore(
        hardware_resource=hardware_api,
        attached_modules=[],
        attached_subsystems={},
        estop_state=hw_types.EstopState.DISENGAGED,
        door_state=hw_types.DoorState.CLOSED,
        module_door_serial=None,
    )


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
def run_data() -> MagicMock:
    return MagicMock(spec=RunDataManager)


@pytest.fixture
def versions() -> MagicMock:
    m = MagicMock(spec=get_versions)
    m.return_value = ComponentVersions(
        api_version="someTestApiVersion",
        system_version="someTestSystemVersion",
    )
    return m


@pytest.fixture
def _override_hardware_with_mock(hardware: MagicMock) -> Iterator[None]:
    async def get_hardware_override() -> HardwareControlAPI:
        """Override for the get_hardware() FastAPI dependency."""
        return hardware

    app.dependency_overrides[get_hardware] = get_hardware_override
    yield
    del app.dependency_overrides[get_hardware]


@pytest.fixture
def _override_sql_engine_with_mock() -> Iterator[None]:
    async def get_sql_engine_override() -> SQLEngine:
        """Override for the get_sql_engine() FastAPI dependency."""
        return MagicMock(spec=SQLEngine)

    app.dependency_overrides[get_sql_engine] = get_sql_engine_override
    yield
    del app.dependency_overrides[get_sql_engine]


@pytest.fixture
def _override_version_with_mock(versions: MagicMock) -> Iterator[None]:
    async def get_version_override() -> ComponentVersions:
        """Override for the get_versions() FastAPI dependency."""
        return cast(ComponentVersions, await versions())

    app.dependency_overrides[get_versions] = get_version_override
    yield
    del app.dependency_overrides[get_versions]


@pytest.fixture
def _override_ot2_hardware_with_mock(hardware: MagicMock) -> Iterator[None]:
    async def get_ot2_hardware_override() -> API:
        """Override for the get_ot2_hardware FastAPI dependency."""
        return hardware

    app.dependency_overrides[get_ot2_hardware] = get_ot2_hardware_override
    yield
    del app.dependency_overrides[get_ot2_hardware]


@pytest.fixture
def _override_run_data_manager_with_mock(run_data: MagicMock) -> Iterator[None]:
    async def get_run_data_manager_override() -> RunDataManager:
        """Override for the get_run_data_manager FastAPI dependency."""
        return run_data

    app.dependency_overrides[get_run_data_manager] = get_run_data_manager_override
    yield
    del app.dependency_overrides[get_run_data_manager]


@pytest.fixture
def _override_notification_client_with_mock(decoy: Decoy) -> Iterator[None]:
    """Override app_state to include a mocked notification client."""
    mock_notification_client = decoy.mock(cls=NotificationClient)

    async def get_notification_client_override() -> NotificationClient:
        return mock_notification_client

    app.dependency_overrides[get_notification_client] = get_notification_client_override
    yield
    del app.dependency_overrides[get_notification_client]


@pytest.fixture
def _override_authentication_checker_with_always_allowed(
    decoy: Decoy,
) -> Iterator[None]:
    authentication_checker = AlwaysAllowedAuthenticationChecker()

    async def get_authentication_checker_override() -> AuthenticationChecker:
        return authentication_checker

    app.dependency_overrides[get_authentication_checker] = (
        get_authentication_checker_override
    )
    yield
    del app.dependency_overrides[get_authentication_checker]


@pytest.fixture
def mock_audit_client(decoy: Decoy) -> AuditClient:
    return decoy.mock(cls=AuditClient)


@pytest.fixture
async def _override_audit_client_with_mock(
    mock_audit_client: AuditClient,
    decoy: Decoy,
) -> AsyncIterator[None]:
    def get_audit_client_override() -> AuditClient:
        return mock_audit_client

    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=False, minLengthOfReasonForInteraction=None
        )
    )
    app.dependency_overrides[get_audit_client] = get_audit_client_override
    install_audit_client(app.state, mock_audit_client)
    yield
    del app.dependency_overrides[get_audit_client]


@pytest.fixture
def api_client(
    _override_hardware_with_mock: None,
    _override_sql_engine_with_mock: None,
    _override_version_with_mock: None,
    _override_ot2_hardware_with_mock: None,
    _override_notification_client_with_mock: None,
    _override_authentication_checker_with_always_allowed: None,
    _override_audit_client_with_mock: None,
) -> TestClient:
    client = TestClient(app)
    client.headers.update(
        {API_VERSION_HEADER: cast(str, LATEST_API_VERSION_HEADER_VALUE)}
    )
    return client


@pytest.fixture
def api_client_camera_overrides(
    _override_hardware_with_mock: None,
    _override_sql_engine_with_mock: None,
    _override_version_with_mock: None,
    _override_ot2_hardware_with_mock: None,
    _override_run_data_manager_with_mock: None,
    _override_notification_client_with_mock: None,
    _override_authentication_checker_with_always_allowed: None,
    _override_audit_client_with_mock: None,
) -> TestClient:
    client = TestClient(app)
    client.headers.update(
        {API_VERSION_HEADER: cast(str, LATEST_API_VERSION_HEADER_VALUE)}
    )
    return client


@pytest.fixture
def api_client_no_errors(
    _override_hardware_with_mock: None, _override_sql_engine_with_mock: None
) -> TestClient:
    """An API client that won't raise server exceptions.
    Use only to test 500 pages; never use this for other tests."""
    client = TestClient(app, raise_server_exceptions=False)
    client.headers.update(
        {API_VERSION_HEADER: cast(str, LATEST_API_VERSION_HEADER_VALUE)}
    )
    return client


@pytest.fixture(scope="session")
def server_temp_directory() -> Iterator[str]:
    new_dir = tempfile.mkdtemp()
    os.environ["OT_API_CONFIG_DIR"] = new_dir
    config.reload()
    yield new_dir


@pytest.fixture
def attach_pipettes(server_temp_directory: str) -> Iterator[None]:
    import json

    pipette = {"dropTipShake": True, "model": "p300_multi_v1"}

    pipette_dir_path = os.path.join(server_temp_directory, "pipettes")
    pipette_file_path = os.path.join(pipette_dir_path, "P300MV1020230630.json")

    # FIXME There are random files somehow getting added to this directory
    # with the IDs 123 & 321. This is a temporary solution to remove
    # any unexpected files.
    for fi in Path(pipette_dir_path).iterdir():
        if fi.is_file():
            fi.unlink()

    os.environ["OT_API_CONFIG_DIR"] = server_temp_directory
    with open(pipette_file_path, "w") as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)
    del os.environ["OT_API_CONFIG_DIR"]


@pytest.fixture
def set_up_pipette_offset_temp_directory(server_temp_directory: str) -> None:
    attached_pip_list = ["123", "321"]
    mount_list = [Mount.LEFT, Mount.RIGHT]
    definition = labware.get_labware_definition("opentrons_96_filtertiprack_200ul")
    def_hash = helpers.hash_labware_def(definition)
    for pip, mount in zip(attached_pip_list, mount_list):
        save_pipette_calibration(
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
    assert definition["schemaVersion"] == 2  # Required by create_tip_length_data().
    for pip, tip_len in zip(attached_pip_list, tip_length_list):
        cal_data = create_tip_length_data(definition, tip_len)
        save_tip_length_calibration(pip, cal_data)


@pytest.fixture
def set_up_deck_calibration_temp_directory(server_temp_directory: str) -> None:
    attitude = [[1.0008, 0.0052, 0.0], [-0.0, 0.992, 0.0], [0.0, 0.0, 1.0]]
    save_robot_deck_attitude(
        attitude,
        "pip_1",
        "fakehash",
    )


@pytest.fixture
def session_manager(hardware: HardwareControlAPI) -> SessionManager:
    return SessionManager(
        hardware=hardware,
        motion_lock=ThreadedAsyncLock(),
    )


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
        "metadata": {
            "displayName": "minimal labware",
            "displayCategory": "tipRack",
            "displayVolumeUnits": "µL",
        },
        "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
        "parameters": {
            "isTiprack": True,
            "tipLength": 55.3,
            "tipOverlap": 2.8,
            "loadName": "minimal_labware_def",
            "format": "96Standard",
            "isMagneticModuleCompatible": False,
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
def sql_engine(tmp_path: Path) -> Generator[SQLEngine, None, None]:
    """Return a set-up database to back the store."""
    with make_sql_engine(tmp_path) as engine:
        yield engine


@contextmanager
def make_sql_engine(parent_dir: Path) -> Generator[SQLEngine, None, None]:
    """Like sql_engine, but not a pytest fixture."""
    db_file_path = parent_dir / "test.db"
    with sql_engine_ctx(db_file_path) as engine:
        metadata.create_all(engine)
        yield engine


def datetime_to_zulu_iso8601(dt: datetime) -> str:
    """Serialize a datetime to an ISO8601 string.

    If the timezone is UTC, represent that with "Z", which matches what Pydantic does,
    instead instead of with "+00:00", which is Python's default.

    e.g. "2024-12-10T19:40:55.984327Z" vs. "2024-12-10T19:40:55.984327+00:00".
    """
    return dt.isoformat().replace("+00:00", "Z")


# todo(mm, 2024-12-10):
# In Python 3.11+, we can replace this with just datetime.fromisoformat().
def zulu_iso8601_to_datetime(iso8601_str: str) -> datetime:
    """Parse an ISO8601 datetime string with a "Z" timezone.

    See `datetime_to_zulu_iso8601()`.
    """
    return datetime.fromisoformat(iso8601_str.replace("Z", "+00:00"))


@pytest.fixture
def mock_feature_flags(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(config.feature_flags, inspect.isfunction):
        params = inspect.getfullargspec(func)
        mock_get_ff = decoy.mock(func=func)
        if any("robot_type" in p for p in params.args):
            decoy.when(mock_get_ff(RobotTypeEnum.FLEX)).then_return(False)
        else:
            decoy.when(mock_get_ff()).then_return(False)
        monkeypatch.setattr(config.feature_flags, name, mock_get_ff)
