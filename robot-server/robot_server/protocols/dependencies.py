"""FastAPI dependencies for protocol endpoints."""


import logging

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine
from typing_extensions import Final, Literal
from pathlib import Path
from anyio import Path as AsyncPath

from opentrons.config import feature_flags
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import create_simulating_runner

from robot_server.app_state import AppState, AppStateAccessor, get_app_state
from robot_server.deletion_planner import ProtocolDeletionPlanner
from robot_server.persistence import get_sql_engine, get_persistence_directory

from .protocol_auto_deleter import ProtocolAutoDeleter
from .protocol_store import (
    ProtocolStore,
)
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore


_PROTOCOL_FILES_SUBDIRECTORY: Final = "protocols"

_log = logging.getLogger(__name__)

_protocol_store_accessor = AppStateAccessor[ProtocolStore]("protocol_store")
_analysis_store_accessor = AppStateAccessor[AnalysisStore]("analysis_store")
_protocol_directory_accessor = AppStateAccessor[Path]("protocol_directory")


def get_protocol_reader() -> ProtocolReader:
    """Get a ProtocolReader to read and save uploaded protocol files."""
    return ProtocolReader()


async def get_protocol_directory(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(get_persistence_directory),
) -> Path:
    """Get the directory to save protocol files, creating it if needed."""
    protocol_directory = _protocol_directory_accessor.get_from(app_state)

    if protocol_directory is None:
        protocol_directory = persistence_directory / _PROTOCOL_FILES_SUBDIRECTORY
        await AsyncPath(protocol_directory).mkdir(exist_ok=True)
        _protocol_directory_accessor.set_on(app_state, protocol_directory)

    return protocol_directory


async def get_protocol_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
    protocol_directory: Path = Depends(get_protocol_directory),
    protocol_reader: ProtocolReader = Depends(get_protocol_reader),
) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    protocol_store = _protocol_store_accessor.get_from(app_state)

    if protocol_store is None:
        protocol_store = await ProtocolStore.rehydrate(
            sql_engine=sql_engine,
            protocols_directory=protocol_directory,
            protocol_reader=protocol_reader,
        )
        _protocol_store_accessor.set_on(app_state, protocol_store)

    return protocol_store


def get_analysis_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store_accessor.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore(sql_engine=sql_engine)
        _analysis_store_accessor.set_on(app_state, analysis_store)

    return analysis_store


async def get_analysis_robot_type() -> Literal["OT-2 Standard", "OT-3 Standard"]:
    if feature_flags.enable_ot3_hardware_controller():
        return "OT-3 Standard"
    else:
        return "OT-2 Standard"


async def get_protocol_analyzer(
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    analysis_robot_type: Literal["OT-2 Standard", "OT-3 Standard"] = Depends(get_analysis_robot_type),
) -> ProtocolAnalyzer:
    """Construct a ProtocolAnalyzer for a single request."""
    protocol_runner = await create_simulating_runner(robot_type=analysis_robot_type)

    return ProtocolAnalyzer(
        protocol_runner=protocol_runner,
        analysis_store=analysis_store,
    )


async def get_protocol_auto_deleter(
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(),
    )
