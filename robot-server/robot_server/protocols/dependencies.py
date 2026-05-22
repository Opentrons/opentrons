"""FastAPI dependencies for protocol endpoints."""

from asyncio import Lock as AsyncLock
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from anyio import Path as AsyncPath
from fastapi import Depends, File, Form, UploadFile
from sqlalchemy.engine import Engine as SQLEngine
from typing_extensions import Annotated

from opentrons.protocol_reader import FileHasher, FileReaderWriter, ProtocolReader
from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationChecker,
)
from server_utils.auth.resource_server.fastapi import get_authorization_checker
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.fastapi_utils.documented_interaction import (
    get_supplied_user_notes,
)

from .analyses_manager import AnalysesManager
from .analysis_store import AnalysisStore
from .protocol_auto_deleter import ProtocolAutoDeleter
from .protocol_store import (
    ProtocolStore,
)
from robot_server.deletion_planner import ProtocolDeletionPlanner
from robot_server.fastapi_dependencies import (
    maybe_record_documented_interaction_non_json,
)
from robot_server.persistence.fastapi_dependencies import (
    get_active_persistence_directory,
    get_sql_engine,
)
from robot_server.persistence.file_and_directory_names import PROTOCOLS_DIRECTORY
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.runs.dependencies import get_run_process_pyro_provider
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.task_runner import TaskRunner, get_task_runner
from robot_server.settings import get_settings

_protocol_store_init_lock = AsyncLock()
_protocol_store_accessor = AppStateAccessor[ProtocolStore]("protocol_store")

_analysis_store_accessor = AppStateAccessor[AnalysisStore]("analysis_store")

_analyses_manager_accessor = AppStateAccessor[AnalysesManager]("analyses_manager")
_protocol_directory_init_lock = AsyncLock()
_protocol_directory_accessor = AppStateAccessor[Path]("protocol_directory")


def get_protocol_reader() -> ProtocolReader:
    """Get a ProtocolReader to read and save uploaded protocol files."""
    return ProtocolReader()


def get_file_reader_writer() -> FileReaderWriter:
    """Get a FileReaderWriter to read file streams into memory and write file streams to disk."""
    return FileReaderWriter()


def get_file_hasher() -> FileHasher:
    """Get a FileHasher to hash a file and see if it already exists on the server."""
    return FileHasher()


async def get_protocol_upload_id() -> str:
    """Unique id for a new protocol upload (shared by route and audit dependencies)."""
    return await get_unique_id()


async def maybe_audit_protocol_upload(
    protocol_id: Annotated[str, Depends(get_protocol_upload_id)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    authorization_checker: Annotated[
        AuthorizationChecker, Depends(get_authorization_checker)
    ],
    user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    files: List[UploadFile] = File(...),
    key: Annotated[
        Optional[str],
        Form(
            description=(
                "An arbitrary client-defined string to attach to the new protocol resource."
            ),
        ),
    ] = None,
    run_time_parameter_values: Annotated[
        Optional[str],
        Form(
            description="Key-value pairs of run-time parameters defined in a protocol.",
            alias="runTimeParameterValues",
        ),
    ] = None,
    protocol_kind: Annotated[
        ProtocolKind,
        Form(
            description="Whether this is a `standard` or `quick-transfer` protocol.",
            alias="protocolKind",
        ),
    ] = ProtocolKind.STANDARD,
    run_time_parameter_files: Annotated[
        Optional[str],
        Form(
            description="Param-file pairs of CSV run-time parameters defined in the protocol.",
            alias="runTimeParameterFiles",
        ),
    ] = None,
) -> None:
    """When auth-server requires it, require ``userNotes`` and record the upload."""
    await maybe_record_documented_interaction_non_json(
        resource_id=protocol_id,
        request_data={
            "uploadedFileNames": [f.filename for f in files],
            "key": key,
            "protocolKind": protocol_kind,
            "runTimeParameterValues": run_time_parameter_values,
            "runTimeParameterFiles": run_time_parameter_files,
        },
        user_notes=user_notes,
        created_at=created_at,
        authorization_checker=authorization_checker,
    )


async def get_protocol_directory(
    app_state: Annotated[AppState, Depends(get_app_state)],
    persistence_directory: Annotated[Path, Depends(get_active_persistence_directory)],
) -> Path:
    """Get the directory to save protocol files, creating it if needed."""
    async with _protocol_directory_init_lock:
        protocol_directory = _protocol_directory_accessor.get_from(app_state)
        if protocol_directory is None:
            protocol_directory = persistence_directory / PROTOCOLS_DIRECTORY
            await AsyncPath(protocol_directory).mkdir(exist_ok=True)
            _protocol_directory_accessor.set_on(app_state, protocol_directory)

        return protocol_directory


async def get_protocol_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
    protocol_directory: Annotated[Path, Depends(get_protocol_directory)],
    protocol_reader: Annotated[ProtocolReader, Depends(get_protocol_reader)],
) -> ProtocolStore:
    """Get a singleton ProtocolStore to keep track of created protocols."""
    async with _protocol_store_init_lock:
        protocol_store = _protocol_store_accessor.get_from(app_state)
        if protocol_store is None:
            protocol_store = await ProtocolStore.rehydrate(
                sql_engine=sql_engine,
                protocols_directory=protocol_directory,
                protocol_reader=protocol_reader,
            )
            _protocol_store_accessor.set_on(app_state, protocol_store)

        return protocol_store


async def get_analysis_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
) -> AnalysisStore:
    """Get a singleton AnalysisStore to keep track of created analyses."""
    analysis_store = _analysis_store_accessor.get_from(app_state)

    if analysis_store is None:
        analysis_store = AnalysisStore(sql_engine=sql_engine)
        _analysis_store_accessor.set_on(app_state, analysis_store)

    return analysis_store


async def get_analyses_manager(
    app_state: Annotated[AppState, Depends(get_app_state)],
    analysis_store: Annotated[AnalysisStore, Depends(get_analysis_store)],
    task_runner: Annotated[TaskRunner, Depends(get_task_runner)],
    run_process_pyro_provider: Annotated[
        RunProcessPyroProvider, Depends(get_run_process_pyro_provider)
    ],
) -> AnalysesManager:
    """Get a singleton AnalysesManager to keep track of analyzers."""
    analyses_manager = _analyses_manager_accessor.get_from(app_state)

    if analyses_manager is None:
        analyses_manager = AnalysesManager(
            analysis_store=analysis_store,
            task_runner=task_runner,
            run_process_pyro_provider=run_process_pyro_provider,
        )
        _analyses_manager_accessor.set_on(app_state, analyses_manager)

    return analyses_manager


async def get_protocol_auto_deleter(
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(
            maximum_unused_protocols=get_settings().maximum_unused_protocols
        ),
        protocol_kind=ProtocolKind.STANDARD,
    )


async def get_quick_transfer_protocol_auto_deleter(
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> ProtocolAutoDeleter:
    """Get a `ProtocolAutoDeleter` to delete old quick transfer protocols."""
    return ProtocolAutoDeleter(
        protocol_store=protocol_store,
        deletion_planner=ProtocolDeletionPlanner(
            maximum_unused_protocols=get_settings().maximum_quick_transfer_protocols
        ),
        protocol_kind=ProtocolKind.QUICK_TRANSFER,
    )


def get_maximum_quick_transfer_protocols() -> int:
    """Get the maximum quick transfer protocol setting."""
    return get_settings().maximum_quick_transfer_protocols
