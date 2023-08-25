"""Completed analysis storage and access."""
from __future__ import annotations

from typing import Dict, List, Optional
from logging import getLogger
from dataclasses import dataclass
import sqlalchemy
import anyio

from robot_server.persistence import analysis_table, sqlite_rowid
from robot_server.persistence import legacy_pickle

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

        def serialize_completed_analysis() -> bytes:
            return legacy_pickle.dumps(self.completed_analysis.dict())

        serialized_completed_analysis = await anyio.to_thread.run_sync(
            serialize_completed_analysis,
            # Cancellation may orphan the worker thread,
            # but that should be harmless in this case.
            cancellable=True,
        )

        return {
            "id": self.id,
            "protocol_id": self.protocol_id,
            "analyzer_version": self.analyzer_version,
            "completed_analysis": serialized_completed_analysis,
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

    _memcache: MemoryCache[str, CompletedAnalysisResource]
    _sql_engine: sqlalchemy.engine.Engine
    _current_analyzer_version: str

    def __init__(
        self,
        sql_engine: sqlalchemy.engine.Engine,
        memory_cache: MemoryCache[str, CompletedAnalysisResource],
        current_analyzer_version: str,
    ) -> None:
        self._sql_engine = sql_engine
        self._memcache = memory_cache
        self._current_analyzer_version = current_analyzer_version

    async def get_by_id(self, analysis_id: str) -> Optional[CompletedAnalysisResource]:
        """Return the analysis with the given ID, if it exists."""

        async def get_from_db_and_parse() -> Optional[CompletedAnalysisResource]:
            statement = sqlalchemy.select(analysis_table).where(
                analysis_table.c.id == analysis_id
            )
            with self._sql_engine.begin() as transaction:
                try:
                    raw_value_from_db = transaction.execute(statement).one()
                except sqlalchemy.exc.NoResultFound:
                    return None
            return await CompletedAnalysisResource.from_sql_row(
                raw_value_from_db, self._current_analyzer_version
            )

        return await self._memcache.get_or_compute(
            key=analysis_id, compute=get_from_db_and_parse
        )

    async def get_by_protocol(
        self, protocol_id: str
    ) -> List[CompletedAnalysisResource]:
        """Return all analyses associated with the given protocol, oldest-added first.

        If protocol_id doesn't point to a valid protocol, returns an empty list;
        doesn't raise an error.
        """
        # In one atomic step (one SQL transaction, and no `await`s):
        #
        # 1) Figure out which of the protocol's analyses are already in self._memcache.
        # 2) For those that are, get just their IDs.
        # 3) For those that aren't, get their IDs and their blobs so we can parse them.
        with self._sql_engine.begin() as transaction:
            get_ids_statement = (
                sqlalchemy.select(analysis_table.c.id)
                .where(analysis_table.c.protocol_id == protocol_id)
                .order_by(sqlite_rowid)
            )
            ordered_analysis_ids = list(
                transaction.execute(get_ids_statement).scalars()
            )

            analysis_ids = set(ordered_analysis_ids)
            cached_analysis_ids = {
                analysis_id
                for analysis_id in ordered_analysis_ids
                if self._memcache.contains(analysis_id)
            }
            uncached_analysis_ids = analysis_ids - cached_analysis_ids

            get_uncached_rows_statement = sqlalchemy.select(analysis_table).where(
                analysis_table.c.id.in_(uncached_analysis_ids)
            )
            uncached_rows = transaction.execute(get_uncached_rows_statement).all()

        # Because we'll be loading whatever resources are not currently cached
        # using an async method, if this method is called reentrantly then inserting those
        # newly-fetched resources into the memcache could race and eject resources we just
        # added and were about to return. To prevent this, we'll make a second memcache just
        # for this coroutine - since we don't care about size limitations we can just use a
        # dict.
        parsed_analyses: Dict[str, CompletedAnalysisResource] = {}

        # We're assuming self._memcache.get() won't raise. For this to be correct, there must be no
        # `await`s between where we populated cached_analysis_ids and here.
        for cached_analysis_id in cached_analysis_ids:
            parsed_analyses[cached_analysis_id] = self._memcache.get(cached_analysis_id)

        for row_to_parse in uncached_rows:
            uncached_analysis_id = row_to_parse.id

            async def compute() -> Optional[CompletedAnalysisResource]:
                return await CompletedAnalysisResource.from_sql_row(
                    row_to_parse, self._current_analyzer_version
                )

            parsed_analyses[uncached_analysis_id] = await self._memcache.get_or_compute(
                key=uncached_analysis_id, compute=compute  # TODO: None/NULL handling.
            )

        # note: we want to iterate through ordered_analyses_for_protocol rather than
        # just the local_memcache dict to preserve total ordering
        return [parsed_analyses[analysis_id] for analysis_id in ordered_analysis_ids]

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
