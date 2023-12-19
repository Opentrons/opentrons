"""Completed analysis storage and access."""
from __future__ import annotations

import asyncio
from typing import Dict, List, Optional, Tuple
from logging import getLogger
from dataclasses import dataclass

import sqlalchemy
import anyio

from robot_server.persistence import analysis_table, sqlite_rowid
from robot_server.persistence import legacy_pickle
from robot_server.persistence.pickle_protocol_version import PICKLE_PROTOCOL_VERSION

from .analysis_models import CompletedAnalysis
from .analysis_memcache import MemoryCache


_log = getLogger(__name__)


@dataclass
class CompletedAnalysisResource:
    """A protocol analysis that's been completed, storable in a SQL database.

    See `CompletedAnalysisStore`.
    """

    id: str  # Already in completed_analysis, but pulled out for efficient querying.
    protocol_id: str
    analyzer_version: str
    completed_analysis: CompletedAnalysis

    async def to_sql_values(self) -> Dict[str, object]:
        """Return this data as a dict that can be passed to a SQLALchemy insert.

        This potentially involves heavy serialization, so it's offloaded
        to a worker thread.

        Do not modify anything while serialization is ongoing in its worker thread.

        Avoid calling this from inside a SQL transaction, since it might be slow.
        """

        def serialize_completed_analysis() -> Tuple[bytes, str]:
            serialized_pickle = _serialize_completed_analysis_to_pickle(
                self.completed_analysis
            )
            serialized_json = _serialize_completed_analysis_to_json(
                self.completed_analysis
            )
            return serialized_pickle, serialized_json

        serialized_pickle, serialized_json = await anyio.to_thread.run_sync(
            serialize_completed_analysis,
            # Cancellation may orphan the worker thread,
            # but that should be harmless in this case.
            cancellable=True,
        )

        return {
            "id": self.id,
            "protocol_id": self.protocol_id,
            "analyzer_version": self.analyzer_version,
            "completed_analysis": serialized_pickle,
            "completed_analysis_as_document": serialized_json,
        }

    @classmethod
    async def from_sql_row(
        cls, sql_row: sqlalchemy.engine.Row, current_analyzer_version: str
    ) -> CompletedAnalysisResource:
        """Extract the data from a SQLAlchemy row object.

        This potentially involves heavy parsing, so it's offloaded to a worker thread.

        Avoid calling this from inside a SQL transaction, since it might be slow.
        """
        analyzer_version = sql_row.analyzer_version
        if analyzer_version != current_analyzer_version:
            _log.warning(
                f'Analysis in database was created under version "{analyzer_version}",'
                f' but we are version "{current_analyzer_version}".'
                f" This may cause compatibility problems."
            )
        assert isinstance(analyzer_version, str)

        id = sql_row.id
        assert isinstance(id, str)

        protocol_id = sql_row.protocol_id
        assert isinstance(protocol_id, str)

        def parse_completed_analysis() -> CompletedAnalysis:
            return CompletedAnalysis.parse_obj(
                legacy_pickle.loads(sql_row.completed_analysis)
            )

        completed_analysis = await anyio.to_thread.run_sync(
            parse_completed_analysis,
            # Cancellation may orphan the worker thread,
            # but that should be harmless in this case.
            cancellable=True,
        )

        return cls(
            id=id,
            protocol_id=protocol_id,
            analyzer_version=analyzer_version,
            completed_analysis=completed_analysis,
        )


class CompletedAnalysisStore:
    """A SQL-persistent and memory-cached store of protocol analyses that are completed.

    To make accesses to analyses faster, this class does its own in-memory caching of
    completed analyses. This is an annoying thing to have to do, but we can't use an LRU
    cache because the access methods are async, and lru_cache doesn't work with those.
    """

    _sql_engine: sqlalchemy.engine.Engine
    _current_analyzer_version: str

    # Parsing and validating blobs from the database into CompletedAnalysisResources
    # is a major compute bottleneck. It can take minutes for long protocols.
    # Caching it can speed up the overall HTTP response time by ~10x (after the first request).
    _memcache: MemoryCache[str, CompletedAnalysisResource]

    # This is a lock for performance, not correctness.
    #
    # If multiple clients request the same resources all at once, we want to handle the requests
    # serially to take the most advantage of _memcache. Otherwise, two concurrent requests for the
    # same uncached CompletedAnalysisResource would each do their own work to parse it, which would
    # be redundant and waste compute time.
    #
    # Handling requests serially does not harm overall throughput because even if we handled them
    # concurrently, we'd be bottlenecked by Python's GIL. It will, however, increase latency for
    # a small request if it gets blocked behind a big request.
    _memcache_lock: asyncio.Lock

    def __init__(
        self,
        sql_engine: sqlalchemy.engine.Engine,
        memory_cache: MemoryCache[str, CompletedAnalysisResource],
        current_analyzer_version: str,
    ) -> None:
        self._sql_engine = sql_engine
        self._current_analyzer_version = current_analyzer_version
        self._memcache = memory_cache
        self._memcache_lock = asyncio.Lock()

    async def get_by_id(self, analysis_id: str) -> Optional[CompletedAnalysisResource]:
        """Return the analysis with the given ID, if it exists."""
        async with self._memcache_lock:
            try:
                return self._memcache.get(analysis_id)
            except KeyError:
                pass

            statement = sqlalchemy.select(analysis_table).where(
                analysis_table.c.id == analysis_id
            )
            with self._sql_engine.begin() as transaction:
                try:
                    result = transaction.execute(statement).one()
                except sqlalchemy.exc.NoResultFound:
                    return None

            resource = await CompletedAnalysisResource.from_sql_row(
                result, self._current_analyzer_version
            )
            self._memcache.insert(resource.id, resource)

            return resource

    async def get_by_id_as_document(self, analysis_id: str) -> Optional[str]:
        """Return the analysis with the given ID, if it exists.

        This is like `get_by_id()`, except it returns the analysis as a pre-serialized JSON
        document.
        """
        statement = sqlalchemy.select(
            analysis_table.c.completed_analysis_as_document
        ).where(analysis_table.c.id == analysis_id)

        with self._sql_engine.begin() as transaction:
            try:
                document: Optional[str] = transaction.execute(statement).scalar_one()
            except sqlalchemy.exc.NoResultFound:
                # No analysis with this ID.
                return None

        # Although the completed_analysis_as_document column is nullable,
        # our migration code is supposed to ensure that it's never NULL in practice.
        assert document is not None

        return document

    async def get_by_protocol(
        self, protocol_id: str
    ) -> List[CompletedAnalysisResource]:
        """Return all analyses associated with the given protocol, oldest-added first.

        If protocol_id doesn't point to a valid protocol, returns an empty list;
        doesn't raise an error.
        """
        async with self._memcache_lock:
            id_statement = (
                sqlalchemy.select(analysis_table.c.id)
                .where(analysis_table.c.protocol_id == protocol_id)
                .order_by(sqlite_rowid)
            )
            with self._sql_engine.begin() as transaction:
                ordered_analyses_for_protocol = [
                    row.id for row in transaction.execute(id_statement).all()
                ]

            analysis_set = set(ordered_analyses_for_protocol)
            cached_analyses = {
                analysis_id
                for analysis_id in ordered_analyses_for_protocol
                if self._memcache.contains(analysis_id)
            }
            uncached_analyses = analysis_set - cached_analyses

            # Because we'll be loading whatever resources are not currently cached from sql
            # using an async method, if this method is called reentrantly then inserting those
            # newly-fetched resources into the memcache could race and eject resources we just
            # added and were about to return. To prevent this, we'll make a second memcache just
            # for this coroutine - since we don't care about size limitations we can just use a
            # dict.
            local_memcache: Dict[str, CompletedAnalysisResource] = {}

            for key in cached_analyses:
                local_memcache[key] = self._memcache.get(key)

            if uncached_analyses:
                statement = (
                    sqlalchemy.select(analysis_table)
                    .where(analysis_table.c.id.in_(uncached_analyses))
                    .order_by(sqlite_rowid)
                )
                with self._sql_engine.begin() as transaction:
                    results = transaction.execute(statement).all()
                for r in results:
                    resource = await CompletedAnalysisResource.from_sql_row(
                        r, self._current_analyzer_version
                    )
                    local_memcache[resource.id] = resource
                    self._memcache.insert(resource.id, resource)

            # note: we want to iterate through ordered_analyseS_for_protocol rather than
            # just the local_memcache dict to preserve total ordering
            return [
                local_memcache[analysis_id]
                for analysis_id in ordered_analyses_for_protocol
            ]

    def get_ids_by_protocol(self, protocol_id: str) -> List[str]:
        """Like `get_by_protocol()`, but return only the ID of each analysis."""
        statement = (
            sqlalchemy.select(analysis_table.c.id)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()

        result_ids: List[str] = []
        for row in results:
            assert isinstance(row.id, str)
            result_ids.append(row.id)

        return result_ids

    async def add(self, completed_analysis_resource: CompletedAnalysisResource) -> None:
        """Add a resource to the store."""
        statement = analysis_table.insert().values(
            await completed_analysis_resource.to_sql_values()
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)
        self._memcache.insert(
            completed_analysis_resource.id, completed_analysis_resource
        )


def _serialize_completed_analysis_to_pickle(
    completed_analysis: CompletedAnalysis,
) -> bytes:
    return legacy_pickle.dumps(
        completed_analysis.dict(), protocol=PICKLE_PROTOCOL_VERSION
    )


def _serialize_completed_analysis_to_json(completed_analysis: CompletedAnalysis) -> str:
    return completed_analysis.json(
        # by_alias and exclude_none should match how
        # FastAPI + Pydantic + our customizations serialize these objects
        # over the `GET /protocols/:id/analyses/:id` endpoint.
        by_alias=True,
        exclude_none=False,
    )
