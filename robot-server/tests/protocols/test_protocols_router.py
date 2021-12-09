"""Tests for the /protocols router."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from fastapi import UploadFile

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_runner.pre_analysis import (
    PreAnalyzer,
    NotPreAnalyzableError,
    JsonPreAnalysis,
    PythonPreAnalysis,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import SimpleEmptyResponse
from robot_server.service.task_runner import TaskRunner
from robot_server.protocols.protocol_models import Metadata, Protocol, ProtocolType
from robot_server.protocols.analysis_store import AnalysisStore
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer
from robot_server.protocols.response_builder import ResponseBuilder
from robot_server.protocols.analysis_models import PendingAnalysis

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)

from robot_server.protocols.router import (
    create_protocol,
    get_protocols,
    get_protocol_by_id,
    delete_protocol_by_id,
)


async def test_get_protocols_no_protocols(
    decoy: Decoy,
    response_builder: ResponseBuilder,
    protocol_store: ProtocolStore,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all()).then_return([])

    result = await get_protocols(
        response_builder=response_builder,
        protocol_store=protocol_store,
    )

    assert result.data == []


async def test_get_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return stored protocols."""
    created_at_1 = datetime(year=2021, month=1, day=1)
    created_at_2 = datetime(year=2022, month=2, day=2)

    resource_1 = ProtocolResource(
        protocol_id="abc",
        created_at=created_at_1,
        pre_analysis=PythonPreAnalysis(metadata={}, api_version=APIVersion(1234, 5678)),
        files=[],
    )
    resource_2 = ProtocolResource(
        protocol_id="123",
        created_at=created_at_2,
        pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
        files=[],
    )

    analysis_1 = PendingAnalysis(id="analysis-id-abc")
    analysis_2 = PendingAnalysis(id="analysis-id-123")

    protocol_1 = Protocol(
        id="abc",
        createdAt=created_at_1,
        protocolType=ProtocolType.PYTHON,
        metadata=Metadata(),
        analyses=[analysis_1],
        files=[],
    )
    protocol_2 = Protocol(
        id="123",
        createdAt=created_at_2,
        protocolType=ProtocolType.JSON,
        metadata=Metadata(),
        analyses=[analysis_2],
        files=[],
    )

    decoy.when(protocol_store.get_all()).then_return([resource_1, resource_2])
    decoy.when(analysis_store.get_by_protocol("abc")).then_return([analysis_1])
    decoy.when(analysis_store.get_by_protocol("123")).then_return([analysis_2])
    decoy.when(
        response_builder.build(resource=resource_1, analyses=[analysis_1])
    ).then_return(protocol_1)
    decoy.when(
        response_builder.build(resource=resource_2, analyses=[analysis_2])
    ).then_return(protocol_2)

    result = await get_protocols(
        response_builder=response_builder,
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.data == [protocol_1, protocol_2]


async def test_get_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return a single protocol file."""
    resource = ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=PythonPreAnalysis(metadata={}, api_version=APIVersion(1234, 5678)),
        created_at=datetime(year=2021, month=1, day=1),
        files=[],
    )

    analysis = PendingAnalysis(id="analysis-id")

    protocol = Protocol(
        id="protocol-id",
        createdAt=datetime(year=2021, month=1, day=1),
        protocolType=ProtocolType.PYTHON,
        metadata=Metadata(),
        analyses=[analysis],
        files=[],
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(resource)
    decoy.when(analysis_store.get_by_protocol(protocol_id="protocol-id")).then_return(
        [analysis]
    )
    decoy.when(
        response_builder.build(resource=resource, analyses=[analysis])
    ).then_return(protocol)

    result = await get_protocol_by_id(
        "protocol-id",
        response_builder=response_builder,
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.data == protocol


async def test_get_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    response_builder: ResponseBuilder,
) -> None:
    """It should return a 404 error when requesting a non-existent protocol."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_by_id(
            "protocol-id",
            response_builder=response_builder,
            protocol_store=protocol_store,
        )

    assert exc_info.value.status_code == 404


async def test_create_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
    pre_analyzer: PreAnalyzer,
    protocol_analyzer: ProtocolAnalyzer,
    response_builder: ResponseBuilder,
    task_runner: TaskRunner,
    current_time: datetime,
) -> None:
    """It should store an uploaded protocol file."""
    protocol_file = UploadFile(filename="foo.json")
    metadata_as_dict = {"this_is_fake_metadata": True}
    pre_analysis = JsonPreAnalysis(schema_version=123, metadata=metadata_as_dict)
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=pre_analysis,
        created_at=current_time,
        files=[],
    )
    analysis = PendingAnalysis(id="analysis-id")
    protocol = Protocol(
        id="protocol-id",
        createdAt=current_time,
        protocolType=ProtocolType.JSON,
        metadata=Metadata.parse_obj(metadata_as_dict),
        analyses=[analysis],
        files=[],
    )

    decoy.when(pre_analyzer.analyze([protocol_file])).then_return(pre_analysis)

    decoy.when(
        await protocol_store.create(
            protocol_id="protocol-id",
            created_at=current_time,
            files=[protocol_file],
            pre_analysis=pre_analysis,
        )
    ).then_return(protocol_resource)

    decoy.when(
        analysis_store.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    ).then_return([analysis])

    decoy.when(
        response_builder.build(resource=protocol_resource, analyses=[analysis])
    ).then_return(protocol)

    result = await create_protocol(
        files=[protocol_file],
        response_builder=response_builder,
        protocol_store=protocol_store,
        analysis_store=analysis_store,
        pre_analyzer=pre_analyzer,
        protocol_analyzer=protocol_analyzer,
        task_runner=task_runner,
        protocol_id="protocol-id",
        analysis_id="analysis-id",
        created_at=current_time,
    )

    assert result.data == protocol

    decoy.verify(
        task_runner.run(
            protocol_analyzer.analyze,
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
        )
    )


async def test_create_protocol_not_pre_analyzable(
    decoy: Decoy,
    pre_analyzer: PreAnalyzer,
) -> None:
    """It should 400 if the protocol is rejected by the pre-analyzer."""
    decoy.when(pre_analyzer.analyze(matchers.Anything())).then_raise(
        NotPreAnalyzableError()
    )

    with pytest.raises(ApiError) as exc_info:
        await create_protocol(files=[], pre_analyzer=pre_analyzer)

    assert exc_info.value.status_code == 400


async def test_create_protocol_invalid_file(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    pre_analyzer: PreAnalyzer,
    response_builder: ResponseBuilder,
    unique_id: str,
    current_time: datetime,
) -> None:
    """It should 400 if the file is rejected by the protocol store."""
    decoy.when(pre_analyzer.analyze(matchers.Anything())).then_return(
        JsonPreAnalysis(schema_version=123, metadata={})
    )

    decoy.when(
        await protocol_store.create(
            protocol_id=unique_id,
            created_at=current_time,
            files=[matchers.IsA(UploadFile, {"filename": "foo.json"})],
            pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
        )
    ).then_raise(ProtocolFileInvalidError("oh no"))

    files = [UploadFile(filename="foo.json")]

    with pytest.raises(ApiError) as exc_info:
        await create_protocol(
            files=files,
            response_builder=response_builder,
            protocol_store=protocol_store,
            pre_analyzer=pre_analyzer,
            protocol_id=unique_id,
            created_at=current_time,
        )

    assert exc_info.value.status_code == 400


async def test_delete_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should remove a single protocol file."""
    result = await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    decoy.verify(protocol_store.remove(protocol_id="protocol-id"))

    assert result == SimpleEmptyResponse()


async def test_delete_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should 404 if the protocol to delete is not found."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.remove(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    assert exc_info.value.status_code == 404
