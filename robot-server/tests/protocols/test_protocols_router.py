"""Tests for the /protocols router."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from fastapi import UploadFile
from pathlib import Path

from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_reader import (
    FileReaderWriter,
    FileHasher,
    ProtocolReader,
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
    ProtocolFilesInvalidError,
    BufferedFile,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import SimpleEmptyBody, MultiBodyMeta
from robot_server.service.task_runner import TaskRunner
from robot_server.protocols.analysis_store import AnalysisStore, AnalysisNotFoundError
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer
from robot_server.protocols.protocol_auto_deleter import ProtocolAutoDeleter
from robot_server.protocols.analysis_models import (
    AnalysisStatus,
    AnalysisSummary,
    CompletedAnalysis,
    PendingAnalysis,
    AnalysisResult,
)

from robot_server.protocols.protocol_models import (
    Metadata,
    Protocol,
    ProtocolFile,
    ProtocolType,
)
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolUsedByRunError,
)

from robot_server.protocols.router import (
    ProtocolLinks,
    create_protocol,
    get_protocols,
    get_protocol_ids,
    get_protocol_by_id,
    delete_protocol_by_id,
    get_protocol_analyses,
    get_protocol_analysis_by_id,
)


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mocked out ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture
def analysis_store(decoy: Decoy) -> AnalysisStore:
    """Get a mocked out AnalysisStore interface."""
    return decoy.mock(cls=AnalysisStore)


@pytest.fixture
def file_hasher(decoy: Decoy) -> FileHasher:
    """Get a mocked out FileHasher."""
    return decoy.mock(cls=FileHasher)


@pytest.fixture
def file_reader_writer(decoy: Decoy) -> FileReaderWriter:
    """Get a mocked out FileReaderWriter."""
    return decoy.mock(cls=FileReaderWriter)


@pytest.fixture
def protocol_reader(decoy: Decoy) -> ProtocolReader:
    """Get a mocked out ProtocolReader."""
    return decoy.mock(cls=ProtocolReader)


@pytest.fixture
def protocol_analyzer(decoy: Decoy) -> ProtocolAnalyzer:
    """Get a mocked out ProtocolAnalyzer."""
    return decoy.mock(cls=ProtocolAnalyzer)


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def protocol_auto_deleter(decoy: Decoy) -> ProtocolAutoDeleter:
    """Get a mocked out AutoDeleter."""
    return decoy.mock(cls=ProtocolAutoDeleter)


async def test_get_protocols_no_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all()).then_return([])

    result = await get_protocols(protocol_store=protocol_store)

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
    assert result.status_code == 200


async def test_get_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should return stored protocols."""
    created_at_1 = datetime(year=2021, month=1, day=1)
    created_at_2 = datetime(year=2022, month=2, day=2)

    resource_1 = ProtocolResource(
        protocol_id="abc",
        created_at=created_at_1,
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.py"),
            config=PythonProtocolConfig(api_version=APIVersion(1234, 5678)),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="a_b_c",
        ),
        protocol_key="dummy-key-111",
    )
    resource_2 = ProtocolResource(
        protocol_id="123",
        created_at=created_at_2,
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/123.json"),
            config=JsonProtocolConfig(schema_version=1234),
            files=[],
            metadata={},
            robot_type="OT-3 Standard",
            content_hash="1_2_3",
        ),
        protocol_key="dummy-key-222",
    )

    analysis_1 = AnalysisSummary(id="analysis-id-abc", status=AnalysisStatus.PENDING)
    analysis_2 = AnalysisSummary(id="analysis-id-123", status=AnalysisStatus.PENDING)

    expected_protocol_1 = Protocol(
        id="abc",
        createdAt=created_at_1,
        protocolType=ProtocolType.PYTHON,
        metadata=Metadata(),
        robotType="OT-2 Standard",
        analysisSummaries=[analysis_1],
        files=[],
        key="dummy-key-111",
    )
    expected_protocol_2 = Protocol(
        id="123",
        createdAt=created_at_2,
        protocolType=ProtocolType.JSON,
        metadata=Metadata(),
        robotType="OT-3 Standard",
        analysisSummaries=[analysis_2],
        files=[],
        key="dummy-key-222",
    )

    decoy.when(protocol_store.get_all()).then_return([resource_1, resource_2])
    decoy.when(analysis_store.get_summaries_by_protocol("abc")).then_return(
        [analysis_1]
    )
    decoy.when(analysis_store.get_summaries_by_protocol("123")).then_return(
        [analysis_2]
    )

    result = await get_protocols(
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.content.data == [expected_protocol_1, expected_protocol_2]
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=2)
    assert result.status_code == 200


async def test_get_protocol_ids_no_protocols(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should return an empty collection response with no protocols loaded."""
    decoy.when(protocol_store.get_all_ids()).then_return([])

    result = await get_protocol_ids(protocol_store=protocol_store)

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
    assert result.status_code == 200


async def test_get_protocol_ids(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should return stored protocol ids."""
    decoy.when(protocol_store.get_all_ids()).then_return(
        ["protocol_id_1", "protocol_id_2"]
    )

    result = await get_protocol_ids(
        protocol_store=protocol_store,
    )

    assert result.content.data == ["protocol_id_1", "protocol_id_2"]
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=2)
    assert result.status_code == 200


async def test_get_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should return a single protocol file."""
    resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/protocol.py"),
            config=PythonProtocolConfig(api_version=APIVersion(1234, 5678)),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="a_b_c",
        ),
        protocol_key="dummy-key-111",
    )

    analysis_summary = AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.COMPLETED,
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(resource)
    decoy.when(
        analysis_store.get_summaries_by_protocol(protocol_id="protocol-id")
    ).then_return([analysis_summary])
    decoy.when(
        protocol_store.get_referencing_run_ids(protocol_id="protocol-id")
    ).then_return([])

    result = await get_protocol_by_id(
        "protocol-id",
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.content.data == Protocol(
        id="protocol-id",
        createdAt=datetime(year=2021, month=1, day=1),
        protocolType=ProtocolType.PYTHON,
        metadata=Metadata(),
        robotType="OT-2 Standard",
        analysisSummaries=[analysis_summary],
        files=[],
        key="dummy-key-111",
    )

    assert result.content.links == ProtocolLinks.construct(referencingRuns=[])
    assert result.status_code == 200


async def test_get_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should return a 404 error when requesting a non-existent protocol."""
    not_found_error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_by_id(
            "protocol-id",
            protocol_store=protocol_store,
        )

    assert exc_info.value.status_code == 404


async def test_create_protocol(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
    protocol_reader: ProtocolReader,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    protocol_analyzer: ProtocolAnalyzer,
    task_runner: TaskRunner,
    protocol_auto_deleter: ProtocolAutoDeleter,
) -> None:
    """It should store an uploaded protocol file."""
    protocol_directory = Path("/dev/null")

    protocol_file = UploadFile(filename="foo.json")
    buffered_file = BufferedFile(
        name="blah", contents=bytes("some_content", encoding="utf-8"), path=None
    )

    protocol_source = ProtocolSource(
        directory=Path("/dev/null"),
        main_file=Path("/dev/null/foo.json"),
        files=[
            ProtocolSourceFile(
                path=Path("/dev/null/foo.json"),
                role=ProtocolFileRole.MAIN,
            )
        ],
        metadata={"this_is_fake_metadata": True},
        robot_type="OT-2 Standard",
        config=JsonProtocolConfig(schema_version=123),
        content_hash="a_b_c",
    )

    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=protocol_source,
        protocol_key="dummy-key-111",
    )

    pending_analysis = AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
    )

    decoy.when(await file_reader_writer.read(files=[protocol_file])).then_return(
        [buffered_file]
    )

    decoy.when(await file_hasher.hash(files=[buffered_file])).then_return("abc123")

    decoy.when(
        await protocol_reader.save(
            files=[buffered_file],
            directory=protocol_directory / "protocol-id",
            content_hash="abc123",
        )
    ).then_return(protocol_source)

    decoy.when(
        analysis_store.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    ).then_return(pending_analysis)

    decoy.when(protocol_store.get_all()).then_return([])

    result = await create_protocol(
        files=[protocol_file],
        key="dummy-key-111",
        protocol_directory=protocol_directory,
        protocol_store=protocol_store,
        analysis_store=analysis_store,
        protocol_reader=protocol_reader,
        file_reader_writer=file_reader_writer,
        file_hasher=file_hasher,
        protocol_analyzer=protocol_analyzer,
        task_runner=task_runner,
        protocol_auto_deleter=protocol_auto_deleter,
        robot_type="OT-2 Standard",
        protocol_id="protocol-id",
        analysis_id="analysis-id",
        created_at=datetime(year=2021, month=1, day=1),
    )

    assert result.content.data == Protocol(
        id="protocol-id",
        createdAt=datetime(year=2021, month=1, day=1),
        protocolType=ProtocolType.JSON,
        metadata=Metadata(this_is_fake_metadata=True),  # type: ignore[call-arg]
        robotType="OT-2 Standard",
        analysisSummaries=[pending_analysis],
        files=[ProtocolFile(name="foo.json", role=ProtocolFileRole.MAIN)],
        key="dummy-key-111",
    )
    assert result.status_code == 201

    decoy.verify(
        protocol_auto_deleter.make_room_for_new_protocol(),
        protocol_store.insert(protocol_resource),
        task_runner.run(
            protocol_analyzer.analyze,
            analysis_id="analysis-id",
            protocol_resource=protocol_resource,
        ),
    )


async def test_create_protocol_not_readable(
    decoy: Decoy,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    protocol_reader: ProtocolReader,
    protocol_store: ProtocolStore,
) -> None:
    """It should 422 if the protocol is rejected by the pre-analyzer."""
    decoy.when(await file_reader_writer.read(files=matchers.Anything())).then_return([])
    decoy.when(await file_hasher.hash(files=[])).then_return("abc123")

    decoy.when(protocol_store.get_all()).then_return([])

    decoy.when(
        await protocol_reader.save(
            directory=matchers.Anything(),
            files=matchers.Anything(),
            content_hash="abc123",
        )
    ).then_raise(ProtocolFilesInvalidError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await create_protocol(
            files=[],
            protocol_directory=Path("/dev/null"),
            protocol_reader=protocol_reader,
            protocol_store=protocol_store,
            protocol_id="protocol-id",
            file_reader_writer=file_reader_writer,
            file_hasher=file_hasher,
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolFilesInvalid"
    assert exc_info.value.content["errors"][0]["detail"] == "oh no"


async def test_create_protocol_different_robot_type(
    decoy: Decoy,
    protocol_reader: ProtocolReader,
    protocol_store: ProtocolStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
) -> None:
    """It should 422 if the protocol's robot type doesn't match the server's."""
    decoy.when(await file_reader_writer.read(files=matchers.Anything())).then_return([])
    decoy.when(await file_hasher.hash(files=[])).then_return("abc123")

    decoy.when(
        await protocol_reader.save(
            directory=matchers.Anything(),
            files=matchers.Anything(),
            content_hash="abc123",
        )
    ).then_return(
        ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/foo.json"),
            files=[
                ProtocolSourceFile(
                    path=Path("/dev/null/foo.json"),
                    role=ProtocolFileRole.MAIN,
                )
            ],
            metadata={},
            robot_type="OT-2 Standard",
            config=JsonProtocolConfig(schema_version=123),
            content_hash="a_b_c",
        )
    )

    decoy.when(protocol_store.get_all()).then_return([])

    with pytest.raises(ApiError) as exc_info:
        await create_protocol(
            files=[],
            protocol_directory=Path("/dev/null"),
            protocol_reader=protocol_reader,
            protocol_store=protocol_store,
            file_reader_writer=file_reader_writer,
            file_hasher=file_hasher,
            protocol_id="protocol-id",
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolRobotTypeMismatch"


async def test_delete_protocol_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should remove a single protocol file."""
    result = await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    decoy.verify(protocol_store.remove(protocol_id="protocol-id"))

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


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


async def test_delete_protocol_run_exists(
    decoy: Decoy,
    protocol_store: ProtocolStore,
) -> None:
    """It should 404 if the protocol to delete is not found."""
    run_exists_error = ProtocolUsedByRunError("protocol-id")

    decoy.when(protocol_store.remove(protocol_id="protocol-id")).then_raise(
        run_exists_error
    )

    with pytest.raises(ApiError) as exc_info:
        await delete_protocol_by_id("protocol-id", protocol_store=protocol_store)

    assert exc_info.value.status_code == 409


async def test_get_protocol_analyses(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should get all analyses of a protocol."""
    analysis = CompletedAnalysis(
        id="analysis-id",
        result=AnalysisResult.OK,
        labware=[],
        pipettes=[],
        commands=[],
        errors=[],
        liquids=[],
    )

    decoy.when(protocol_store.has("protocol-id")).then_return(True)
    decoy.when(await analysis_store.get_by_protocol("protocol-id")).then_return(
        [analysis]
    )

    result = await get_protocol_analyses(
        protocolId="protocol-id",
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.status_code == 200
    assert result.content.data == [analysis]


async def test_get_protocol_analyses_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should 404 if protocol does not exist."""
    decoy.when(protocol_store.has("protocol-id")).then_return(False)

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_analyses(
            protocolId="protocol-id",
            protocol_store=protocol_store,
            analysis_store=analysis_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolNotFound"


async def test_get_protocol_analysis_by_id(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should get a single full analysis by ID."""
    analysis = PendingAnalysis(id="analysis-id")

    decoy.when(protocol_store.has("protocol-id")).then_return(True)
    decoy.when(await analysis_store.get("analysis-id")).then_return(analysis)

    result = await get_protocol_analysis_by_id(
        protocolId="protocol-id",
        analysisId="analysis-id",
        protocol_store=protocol_store,
        analysis_store=analysis_store,
    )

    assert result.status_code == 200
    assert result.content.data == analysis


async def test_get_protocol_analysis_by_id_protocol_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should 404 if the protocol does not exist."""
    decoy.when(protocol_store.has("protocol-id")).then_return(False)

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_analysis_by_id(
            protocolId="protocol-id",
            analysisId="analysis-id",
            protocol_store=protocol_store,
            analysis_store=analysis_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolNotFound"


async def test_get_protocol_analysis_by_id_analysis_not_found(
    decoy: Decoy,
    protocol_store: ProtocolStore,
    analysis_store: AnalysisStore,
) -> None:
    """It should get a single full analysis by ID."""
    decoy.when(protocol_store.has("protocol-id")).then_return(True)
    decoy.when(await analysis_store.get("analysis-id")).then_raise(
        AnalysisNotFoundError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await get_protocol_analysis_by_id(
            protocolId="protocol-id",
            analysisId="analysis-id",
            protocol_store=protocol_store,
            analysis_store=analysis_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "AnalysisNotFound"
