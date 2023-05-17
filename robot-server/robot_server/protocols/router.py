"""Router for /protocols endpoints."""
import logging
from textwrap import dedent
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, status, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from typing_extensions import Literal

from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolFilesInvalidError,
    FileReaderWriter,
    FileHasher,
)
from opentrons_shared_data.robot.dev_types import RobotType
from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.hardware import get_robot_type
from robot_server.service.task_runner import TaskRunner, get_task_runner
from robot_server.service.dependencies import get_unique_id, get_current_time
from robot_server.service.json_api import (
    Body,
    SimpleBody,
    SimpleMultiBody,
    SimpleEmptyBody,
    MultiBodyMeta,
    PydanticResponse,
)

from .protocol_auto_deleter import ProtocolAutoDeleter
from .protocol_models import Protocol, ProtocolFile, Metadata
from .protocol_analyzer import ProtocolAnalyzer
from .analysis_store import AnalysisStore, AnalysisNotFoundError
from .analysis_models import ProtocolAnalysis
from .protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolUsedByRunError,
)
from .dependencies import (
    get_protocol_auto_deleter,
    get_protocol_reader,
    get_protocol_store,
    get_analysis_store,
    get_protocol_analyzer,
    get_protocol_directory,
    get_file_reader_writer,
    get_file_hasher,
)


log = logging.getLogger(__name__)


class ProtocolNotFound(ErrorDetails):
    """An error returned when a given protocol cannot be found."""

    id: Literal["ProtocolNotFound"] = "ProtocolNotFound"
    title: str = "Protocol Not Found"


class AnalysisNotFound(ErrorDetails):
    """An error returned when a given protocol analysis cannot be found."""

    id: Literal["AnalysisNotFound"] = "AnalysisNotFound"
    title: str = "Protocol Analysis Not Found"


class ProtocolFilesInvalid(ErrorDetails):
    """An error returned when an uploaded protocol files are invalid."""

    id: Literal["ProtocolFilesInvalid"] = "ProtocolFilesInvalid"
    title: str = "Protocol File(s) Invalid"


class ProtocolRobotTypeMismatch(ErrorDetails):
    """An error returned when an uploaded protocol is for a different type of robot.

    For example, if the protocol is for an OT-3, but this server is running on an OT-2.
    """

    id: Literal["ProtocolRobotTypeMismatch"] = "ProtocolRobotTypeMismatch"
    title: str = "Protocol For Different Robot Type"


class ProtocolUsedByRun(ErrorDetails):
    """An error returned when a protocol is used by a run and cannot be deleted."""

    id: Literal["ProtocolUsedByRun"] = "ProtocolUsedByRun"
    title: str = "Protocol Used by Run"


class RunLink(BaseModel):
    """Link to a run resource."""

    id: str = Field(..., description="The run's id")
    href: str = Field(..., description="The run's URL")


class ProtocolLinks(BaseModel):
    """Links returned along with a protocol resource."""

    referencingRuns: List[RunLink] = Field(
        ...,
        description="Links to runs that reference the protocol.",
    )


protocols_router = APIRouter()


@protocols_router.post(
    path="/protocols",
    summary="Upload a protocol",
    description=dedent(
        """
        Upload a protocol to your device. You may include the following files:

        - A single Python protocol file and 0 or more custom labware JSON files
        - A single JSON protocol file (any additional labware files will be ignored)

        When too many protocols already exist, old ones will be automatically deleted
        to make room for the new one.
        A protocol will never be automatically deleted if there's a run
        referring to it, though.
        """
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Protocol]},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorBody[Union[ProtocolFilesInvalid, ProtocolRobotTypeMismatch]]
        },
    },
)
async def create_protocol(
    files: List[UploadFile] = File(...),
    # use Form because request is multipart/form-data
    # https://fastapi.tiangolo.com/tutorial/request-forms-and-files/
    key: Optional[str] = Form(None),
    protocol_directory: Path = Depends(get_protocol_directory),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    file_reader_writer: FileReaderWriter = Depends(get_file_reader_writer),
    protocol_reader: ProtocolReader = Depends(get_protocol_reader),
    file_hasher: FileHasher = Depends(get_file_hasher),
    protocol_analyzer: ProtocolAnalyzer = Depends(get_protocol_analyzer),
    task_runner: TaskRunner = Depends(get_task_runner),
    protocol_auto_deleter: ProtocolAutoDeleter = Depends(get_protocol_auto_deleter),
    robot_type: RobotType = Depends(get_robot_type),
    protocol_id: str = Depends(get_unique_id, use_cache=False),
    analysis_id: str = Depends(get_unique_id, use_cache=False),
    created_at: datetime = Depends(get_current_time),
) -> PydanticResponse[SimpleBody[Protocol]]:
    """Create a new protocol by uploading its files.

    Arguments:
        files: List of uploaded files, from form-data.
        key: Optional key for client-side tracking
        protocol_directory: Location to store uploaded files.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
        file_hasher: File hashing interface.
        file_reader_writer: Input file reader/writer.
        protocol_reader: Protocol file reading interface.
        protocol_analyzer: Protocol analysis interface.
        task_runner: Background task runner.
        protocol_auto_deleter: An interface to delete old resources to make room for
            the new protocol.
        robot_type: The type of this robot. Protocols meant for other robot types
            are rejected.
        protocol_id: Unique identifier to attach to the protocol resource.
        analysis_id: Unique identifier to attach to the analysis resource.
        created_at: Timestamp to attach to the new resource.
    """
    buffered_files = await file_reader_writer.read(files=files)
    content_hash = await file_hasher.hash(buffered_files)
    cached_protocol_id = protocol_store.get_id_by_hash(content_hash)

    if cached_protocol_id is not None:
        resource = protocol_store.get(protocol_id=cached_protocol_id)
        analyses = analysis_store.get_summaries_by_protocol(
            protocol_id=cached_protocol_id
        )
        data = Protocol.construct(
            id=cached_protocol_id,
            createdAt=resource.created_at,
            protocolType=resource.source.config.protocol_type,
            robotType=resource.source.robot_type,
            metadata=Metadata.parse_obj(resource.source.metadata),
            analysisSummaries=analyses,
            key=resource.protocol_key,
            files=[
                ProtocolFile(name=f.path.name, role=f.role)
                for f in resource.source.files
            ],
        )

        log.info(
            f'Protocol with id "{cached_protocol_id}" with same contents already exists. returning existing protocol data in response payload'
        )

        return await PydanticResponse.create(
            content=SimpleBody.construct(data=data),
            # not returning a 201 because we're not actually creating a new resource
            status_code=status.HTTP_200_OK,
        )

    try:
        source = await protocol_reader.save(
            files=buffered_files,
            directory=protocol_directory / protocol_id,
            content_hash=content_hash,
        )
    except ProtocolFilesInvalidError as e:
        raise ProtocolFilesInvalid(detail=str(e)).as_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ) from e

    if source.robot_type != robot_type:
        raise ProtocolRobotTypeMismatch(
            detail=(
                f"This protocol is for {source.robot_type} robots."
                f" It can't be analyzed or run on this robot,"
                f" which is an {robot_type}."
            )
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)

    protocol_resource = ProtocolResource(
        protocol_id=protocol_id,
        created_at=created_at,
        source=source,
        protocol_key=key,
    )

    protocol_auto_deleter.make_room_for_new_protocol()
    protocol_store.insert(protocol_resource)

    task_runner.run(
        protocol_analyzer.analyze,
        protocol_resource=protocol_resource,
        analysis_id=analysis_id,
    )
    pending_analysis = analysis_store.add_pending(
        protocol_id=protocol_id,
        analysis_id=analysis_id,
    )

    data = Protocol(
        id=protocol_id,
        createdAt=created_at,
        protocolType=source.config.protocol_type,
        robotType=source.robot_type,
        metadata=Metadata.parse_obj(source.metadata),
        analysisSummaries=[pending_analysis],
        key=key,
        files=[ProtocolFile(name=f.path.name, role=f.role) for f in source.files],
    )

    log.info(f'Created protocol "{protocol_id}" and started analysis "{analysis_id}".')

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=data),
        status_code=status.HTTP_201_CREATED,
    )


@protocols_router.get(
    path="/protocols",
    summary="Get uploaded protocols",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[Protocol]}},
)
async def get_protocols(
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> PydanticResponse[SimpleMultiBody[Protocol]]:
    """Get a list of all currently uploaded protocols.

    Args:
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
    """
    protocol_resources = protocol_store.get_all()
    data = [
        Protocol.construct(
            id=r.protocol_id,
            createdAt=r.created_at,
            protocolType=r.source.config.protocol_type,
            robotType=r.source.robot_type,
            metadata=Metadata.parse_obj(r.source.metadata),
            analysisSummaries=analysis_store.get_summaries_by_protocol(r.protocol_id),
            key=r.protocol_key,
            files=[ProtocolFile(name=f.path.name, role=f.role) for f in r.source.files],
        )
        for r in protocol_resources
    ]
    meta = MultiBodyMeta(cursor=0, totalLength=len(data))

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(data=data, meta=meta),
        status_code=status.HTTP_200_OK,
    )


@protocols_router.get(
    path="/protocols/ids",
    summary="Get uploaded protocol ids",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[str]}},
)
async def get_protocol_ids(
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> PydanticResponse[SimpleMultiBody[str]]:
    """Get a list of all protocol ids stored on the server.

    Args:
        protocol_store: In-memory database of protocol resources.
    """
    protocol_ids = protocol_store.get_all_ids()

    meta = MultiBodyMeta(cursor=0, totalLength=len(protocol_ids))

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(data=protocol_ids, meta=meta)
    )


@protocols_router.get(
    path="/protocols/{protocolId}",
    summary="Get an uploaded protocol",
    responses={
        status.HTTP_200_OK: {"model": Body[Protocol, ProtocolLinks]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
    },
)
async def get_protocol_by_id(
    protocolId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> PydanticResponse[Body[Protocol, ProtocolLinks]]:
    """Get an uploaded protocol by ID.

    Args:
        protocolId: Protocol identifier to fetch, pulled from URL.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
    """
    try:
        resource = protocol_store.get(protocol_id=protocolId)
    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    analyses = analysis_store.get_summaries_by_protocol(protocol_id=protocolId)
    referencing_run_ids = protocol_store.get_referencing_run_ids(protocolId)

    data = Protocol.construct(
        id=protocolId,
        createdAt=resource.created_at,
        protocolType=resource.source.config.protocol_type,
        robotType=resource.source.robot_type,
        metadata=Metadata.parse_obj(resource.source.metadata),
        analysisSummaries=analyses,
        key=resource.protocol_key,
        files=[
            ProtocolFile(name=f.path.name, role=f.role) for f in resource.source.files
        ],
    )

    links = ProtocolLinks.construct(
        referencingRuns=[
            RunLink.construct(id=run_id, href=f"/runs/{run_id}")
            for run_id in referencing_run_ids
        ]
    )

    return await PydanticResponse.create(
        content=Body.construct(
            data=data,
            links=links,
        ),
        status_code=status.HTTP_200_OK,
    )


@protocols_router.delete(
    path="/protocols/{protocolId}",
    summary="Delete an uploaded protocol",
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[ProtocolUsedByRun]},
    },
)
async def delete_protocol_by_id(
    protocolId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete an uploaded protocol by ID.

    Arguments:
        protocolId: Protocol identifier to delete, pulled from URL.
        protocol_store: In-memory database of protocol resources.
    """
    try:
        protocol_store.remove(protocol_id=protocolId)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    except ProtocolUsedByRunError as e:
        raise ProtocolUsedByRun(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.construct(),
        status_code=status.HTTP_200_OK,
    )


@protocols_router.get(
    path="/protocols/{protocolId}/analyses",
    summary="Get a protocol's analyses",
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[ProtocolAnalysis]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
    },
)
async def get_protocol_analyses(
    protocolId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> PydanticResponse[SimpleMultiBody[ProtocolAnalysis]]:
    """Get a protocol's full analyses list.

    Analyses are returned in order from least-recently started to most-recently started.

    Arguments:
        protocolId: Protocol identifier to delete, pulled from URL.
        protocol_store: Database of protocol resources.
        analysis_store: Database of analysis resources.
    """
    if not protocol_store.has(protocolId):
        raise ProtocolNotFound(detail=f"Protocol {protocolId} not found").as_error(
            status.HTTP_404_NOT_FOUND
        )

    analyses = await analysis_store.get_by_protocol(protocolId)

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=analyses,
            meta=MultiBodyMeta(cursor=0, totalLength=len(analyses)),
        )
    )


@protocols_router.get(
    path="/protocols/{protocolId}/analyses/{analysisId}",
    summary="Get one of a protocol's analyses",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[ProtocolAnalysis]},
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorBody[Union[ProtocolNotFound, AnalysisNotFound]]
        },
    },
)
async def get_protocol_analysis_by_id(
    protocolId: str,
    analysisId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> PydanticResponse[SimpleBody[ProtocolAnalysis]]:
    """Get a protocol analysis by analysis ID.

    Arguments:
        protocolId: The ID of the protocol, pulled from the URL.
        analysisId: The ID of the analysis, pulled from the URL.
        protocol_store: Protocol resource storage.
        analysis_store: Analysis resource storage.
    """
    if not protocol_store.has(protocolId):
        raise ProtocolNotFound(detail=f"Protocol {protocolId} not found").as_error(
            status.HTTP_404_NOT_FOUND
        )

    try:
        # TODO(mm, 2022-04-28): This will erroneously return an analysis even if
        # this analysis isn't owned by this protocol. This should be an error.
        analysis = await analysis_store.get(analysisId)
    except AnalysisNotFoundError as error:
        raise AnalysisNotFound(detail=str(error)).as_error(
            status.HTTP_404_NOT_FOUND
        ) from error

    return await PydanticResponse.create(content=SimpleBody.construct(data=analysis))
