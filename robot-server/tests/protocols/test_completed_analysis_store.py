"""Test the CompletedAnalysisStore."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy.engine import Engine
from decoy import Decoy

from robot_server.protocols.completed_analysis_store import (
    CompletedAnalysisResource,
    CompletedAnalysisStore,
)
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
)
from robot_server.protocols.analysis_memcache import MemoryCache
from robot_server.protocols.analysis_models import CompletedAnalysis, AnalysisResult, AnalysisStatus
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
)


@pytest.fixture
def memcache(decoy: Decoy) -> MemoryCache[str, CompletedAnalysisResource]:
    """Get a memcache mock."""
    return decoy.mock(cls=MemoryCache)


@pytest.fixture
def subject(
    memcache: MemoryCache[str, CompletedAnalysisResource],
    sql_engine: Engine,
) -> CompletedAnalysisStore:
    """Get a subject."""
    return CompletedAnalysisStore(sql_engine, memcache, "2")


@pytest.fixture
def protocol_store(sql_engine: Engine) -> ProtocolStore:
    """Return a `ProtocolStore` linked to the same database as the subject under test.

    `ProtocolStore` is tested elsewhere.
    We only need it here to prepare the database for our `AnalysisStore` tests.
    An analysis always needs a protocol to link to.
    """
    return ProtocolStore.create_empty(sql_engine=sql_engine)


def make_dummy_protocol_resource(protocol_id: str) -> ProtocolResource:
    """Return a placeholder `ProtocolResource` to insert into a `ProtocolStore`.

    Args:
        protocol_id: The ID to give to the new `ProtocolResource`.
    """
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="abc123",
        ),
        protocol_key=None,
    )


def _completed_analysis_resource(
    analysis_id: str, protocol_id: str
) -> CompletedAnalysisResource:
    return CompletedAnalysisResource(
        analysis_id,
        protocol_id,
        "2",
        CompletedAnalysis(
            id=analysis_id,
            status=AnalysisStatus.COMPLETED,
            result=AnalysisResult.OK,
            pipettes=[],
            labware=[],
            modules=[],
            commands=[],
            errors=[],
            liquids=[],
        ),
    )


async def test_get_by_analysis_id_prefers_cache(
    subject: CompletedAnalysisStore,
    memcache: MemoryCache[str, CompletedAnalysisResource],
    protocol_store: ProtocolStore,
    decoy: Decoy,
) -> None:
    """It should return analyses without using SQL the second time the analyses are accessed."""
    resource = _completed_analysis_resource("analysis-id", "protocol-id")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))
    # When we retrieve a resource via its id we should see it query the cache, and it should
    # return the identity-same resource
    decoy.when(memcache.get("analysis-id")).then_return(resource)
    assert (await subject.get_by_id("analysis-id")) is resource


async def test_get_by_analysis_id_falls_back_to_sql(
    subject: CompletedAnalysisStore,
    memcache: MemoryCache[str, CompletedAnalysisResource],
    protocol_store: ProtocolStore,
    decoy: Decoy,
) -> None:
    """It should return analyses from sql if they are not cached."""
    resource = _completed_analysis_resource("analysis-id", "protocol-id")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))
    await subject.add(resource)
    # the analysis is not cached
    decoy.when(memcache.get("analysis-id")).then_raise(KeyError())
    analysis_from_sql = await subject.get_by_id("analysis-id")
    # the cached analysis should be value-equal to what we entered
    assert analysis_from_sql == resource


async def test_get_by_analysis_id_stores_results_in_cache(
    subject: CompletedAnalysisStore,
    memcache: MemoryCache[str, CompletedAnalysisResource],
    protocol_store: ProtocolStore,
    decoy: Decoy,
) -> None:
    """It should cache successful fetches from sql."""
    resource = _completed_analysis_resource("analysis-id", "protocol-id")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))
    await subject.add(resource)
    # the analysis is not cached
    decoy.when(memcache.get("analysis-id")).then_raise(KeyError())
    from_sql = await subject.get_by_id("analysis-id")
    assert from_sql == resource
    decoy.verify(memcache.insert("analysis-id", from_sql))


async def test_get_by_analysis_id_as_document(
    subject: CompletedAnalysisStore,
    protocol_store: ProtocolStore,
) -> None:
    """It should return the analysis serialized as a JSON string."""
    resource = _completed_analysis_resource("analysis-id", "protocol-id")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))
    await subject.add(resource)
    result = await subject.get_by_id_as_document("analysis-id")
    assert result is not None
    assert json.loads(result) == {
        "id": "analysis-id",
        "result": "ok",
        "status": "completed",
        "commands": [],
        "errors": [],
        "labware": [],
        "liquids": [],
        "modules": [],
        "pipettes": [],
        "result": "ok",
    }


async def test_get_ids_by_protocol(
    subject: CompletedAnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should return correct analysis id lists."""
    resource_1 = _completed_analysis_resource("analysis-id-1", "protocol-id-1")
    resource_2 = _completed_analysis_resource("analysis-id-2", "protocol-id-1")
    resource_3 = _completed_analysis_resource("analysis-id-3", "protocol-id-2")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id-1"))
    protocol_store.insert(make_dummy_protocol_resource("protocol-id-2"))
    await subject.add(resource_1)
    await subject.add(resource_2)
    await subject.add(resource_3)
    assert subject.get_ids_by_protocol("protocol-id-1") == [
        "analysis-id-1",
        "analysis-id-2",
    ]


async def test_get_by_protocol(
    subject: CompletedAnalysisStore,
    memcache: MemoryCache[str, CompletedAnalysisResource],
    protocol_store: ProtocolStore,
    decoy: Decoy,
) -> None:
    """It should get analysis by protocol with appropriate caching."""
    resource_1 = _completed_analysis_resource("analysis-id-1", "protocol-id-1")
    resource_2 = _completed_analysis_resource("analysis-id-2", "protocol-id-1")
    resource_3 = _completed_analysis_resource("analysis-id-3", "protocol-id-2")
    protocol_store.insert(make_dummy_protocol_resource("protocol-id-1"))
    protocol_store.insert(make_dummy_protocol_resource("protocol-id-2"))
    decoy.when(memcache.insert("analysis-id-1", resource_1)).then_return(None)
    decoy.when(memcache.insert("analysis-id-2", resource_2)).then_return(None)
    decoy.when(memcache.insert("analysis-id-3", resource_3)).then_return(None)
    await subject.add(resource_1)
    await subject.add(resource_2)
    await subject.add(resource_3)
    decoy.when(memcache.get("analysis-id-1")).then_raise(KeyError())
    decoy.when(memcache.get("analysis-id-2")).then_return(resource_2)
    decoy.when(memcache.contains("analysis-id-1")).then_return(False)
    decoy.when(memcache.contains("analysis-id-2")).then_return(True)
    decoy.when(memcache.insert("analysis-id-1", resource_1)).then_return(None)
    resources = await subject.get_by_protocol("protocol-id-1")
    assert resources == [resource_1, resource_2]
