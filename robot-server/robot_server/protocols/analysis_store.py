"""Protocol analysis storage."""
from __future__ import annotations

import pickle
from dataclasses import dataclass
from logging import getLogger
from typing import Dict, List, Optional

import anyio
import sqlalchemy

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
    Liquid,
)

from robot_server.persistence import analysis_table, sqlite_rowid

from .analysis_models import (
    AnalysisSummary,
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
    AnalysisStatus,
)

_log = getLogger(__name__)


# We mark every analysis stored in the database with a version string.
#
# When we read an analysis from the database, we must account for the possibility
# that it was stored by an old software version that treated analyses differently.
# These version strings give us a way to notice this condition and deal with it safely.
#
# Examples of cases where this version string might need to change,
# and where we might need to specially handle data stored with prior version strings:
#
#     * We've changed the shape of what we're storing in the database.
#       So the new software needs to migrate the data stored by the old software.
#
#     * We've changed details about how protocols run, causing a protocol's stored
#       analysis to no longer faithfully represent how that protocol would run now.
#
#       This could be something scientific like changing the way that we break down
#       complex liquid-handling commands, or it could be something internal like
#       changing the way we generate Protocol Engine command `key`s.
#
# This does not necessarily have any correspondence with the user-facing
# robot software version.
_CURRENT_ANALYZER_VERSION = "initial"


class AnalysisNotFoundError(ValueError):
    """Exception raised if a given analysis is not found."""

    def __init__(self, analysis_id: str) -> None:
        """Initialize the error's message."""
        super().__init__(f'Analysis "{analysis_id}" not found.')


# TODO(mm, 2022-05-19): Unlike ProtocolStore and RunStore, this class doesn't
# have an in-memory cache. This is because of implementation difficulties:
# this class is currently the only one of the three to have any async methods,
# which functools.lru_cache() doesn't support.
#
# We should have a consistent strategy across all stores.
# Either figure out an in-memory cache that supports async methods,
# or remove in-memory caching from all stores.
class AnalysisStore:
    """Storage interface for protocol analyses.

    Completed analyses (OK or NOT-OK) are saved to persistent storage.

    Pending analyses don't make sense to persist across reboots,
    so they're only kept in-memory, and lost when the store instance is destroyed.
    """

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize the `AnalysisStore`."""
        self._pending_store = _PendingAnalysisStore()
        self._completed_store = _CompletedAnalysisStore(sql_engine=sql_engine)

    def add_pending(self, protocol_id: str, analysis_id: str) -> AnalysisSummary:
        """Add a new pending analysis to the store.

        Args:
            protocol_id: The protocol to add the new pending analysis to.
                Must point to a valid protocol that does not already have
                a pending analysis.
            analysis_id: The ID of the new analysis.
                Must be unique across *all* protocols, not just this one.

        Returns:
            A summary of the just-added analysis.
        """
        new_pending_analysis = self._pending_store.add(
            protocol_id=protocol_id, analysis_id=analysis_id
        )
        return _summarize_pending(pending_analysis=new_pending_analysis)

    async def update(
        self,
        analysis_id: str,
        commands: List[Command],
        labware: List[LoadedLabware],
        pipettes: List[LoadedPipette],
        errors: List[ErrorOccurrence],
        liquids: Optional[List[Liquid]],
    ) -> None:
        """Promote a pending analysis to completed, adding details of its results.

        Args:
            analysis_id: The ID of the analysis to promote.
                Must point to a valid pending analysis.
            commands: See `CompletedAnalysis.commands`.
            labware: See `CompletedAnalysis.labware`.
            pipettes: See `CompletedAnalysis.pipettes`.
            errors: See `CompletedAnalysis.errors`. Also used to infer whether
                the completed analysis result is `OK` or `NOT_OK`.
            liquids: See `CompletedAnalysis.liquids
        """
        protocol_id = self._pending_store.get_protocol_id(analysis_id=analysis_id)

        # No protocol ID means there was no pending analysis with the given analysis ID.
        assert (
            protocol_id is not None
        ), "Analysis ID to update must be for a valid pending analysis."

        if len(errors) > 0:
            result = AnalysisResult.NOT_OK
        else:
            result = AnalysisResult.OK

        completed_analysis = CompletedAnalysis.construct(
            id=analysis_id,
            result=result,
            commands=commands,
            labware=labware,
            pipettes=pipettes,
            errors=errors,
            liquids=liquids,
        )
        completed_analysis_resource = _CompletedAnalysisResource(
            id=completed_analysis.id,
            protocol_id=protocol_id,
            analyzer_version=_CURRENT_ANALYZER_VERSION,
            completed_analysis=completed_analysis,
        )
        await self._completed_store.add(
            completed_analysis_resource=completed_analysis_resource
        )

        self._pending_store.remove(analysis_id=analysis_id)

    async def get(self, analysis_id: str) -> ProtocolAnalysis:
        """Get a single protocol analysis by its ID.

        Raises:
            AnalysisNotFoundError
        """
        pending_analysis = self._pending_store.get(analysis_id=analysis_id)
        completed_analysis_resource = await self._completed_store.get_by_id(
            analysis_id=analysis_id
        )

        if pending_analysis is not None:
            return pending_analysis
        elif completed_analysis_resource is not None:
            return completed_analysis_resource.completed_analysis
        else:
            raise AnalysisNotFoundError(analysis_id=analysis_id)

    def get_summaries_by_protocol(self, protocol_id: str) -> List[AnalysisSummary]:
        """Get summaries of all analyses for a protocol, in order from oldest first.

        If `protocol_id` doesn't point to a valid protocol, returns an empty list.
        """
        completed_analysis_ids = self._completed_store.get_ids_by_protocol(
            protocol_id=protocol_id
        )
        completed_analysis_summaries = [
            AnalysisSummary.construct(id=analysis_id, status=AnalysisStatus.COMPLETED)
            for analysis_id in completed_analysis_ids
        ]

        pending_analysis = self._pending_store.get_by_protocol(protocol_id=protocol_id)
        if pending_analysis is None:
            return completed_analysis_summaries
        else:
            return completed_analysis_summaries + [_summarize_pending(pending_analysis)]

    async def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get all analyses for a protocol, in order from oldest first.

        If `protocol_id` doesn't point to a valid protocol, returns an empty list.
        """
        completed_analysis_resources = await self._completed_store.get_by_protocol(
            protocol_id=protocol_id
        )
        completed_analyses: List[ProtocolAnalysis] = [
            resource.completed_analysis for resource in completed_analysis_resources
        ]

        pending_analysis = self._pending_store.get_by_protocol(protocol_id=protocol_id)

        if pending_analysis is None:
            return completed_analyses
        else:
            return completed_analyses + [pending_analysis]


class _PendingAnalysisStore:
    """An in-memory store of protocol analyses that are pending.

    We only store at most one pending analysis per protocol.
    This makes it easier for us to preserve the correct order of analyses
    when some are stored here, in-memory, and others are stored in the SQL database.
    The in-memory pending one, if it exists, is always more recent than anything
    in the SQL database.
    """

    def __init__(self) -> None:
        self._analyses_by_id: Dict[str, PendingAnalysis] = {}
        self._analysis_ids_by_protocol_id: Dict[str, str] = {}
        self._protocol_ids_by_analysis_id: Dict[str, str] = {}

    def add(self, protocol_id: str, analysis_id: str) -> PendingAnalysis:
        """Add a new pending analysis and associate it with the given protocol."""
        assert (
            protocol_id not in self._analysis_ids_by_protocol_id
        ), "Protocol must not already have a pending analysis."

        new_pending_analysis = PendingAnalysis.construct(id=analysis_id)

        self._analyses_by_id[analysis_id] = new_pending_analysis
        self._analysis_ids_by_protocol_id[protocol_id] = analysis_id
        self._protocol_ids_by_analysis_id[analysis_id] = protocol_id

        return new_pending_analysis

    def remove(self, analysis_id: str) -> None:
        """Remove the pending analysis with the given ID.

        The given analysis must exist.
        """
        protocol_id = self._protocol_ids_by_analysis_id[analysis_id]

        del self._analyses_by_id[analysis_id]
        del self._analysis_ids_by_protocol_id[protocol_id]
        del self._protocol_ids_by_analysis_id[analysis_id]

    def get(self, analysis_id: str) -> Optional[PendingAnalysis]:
        return self._analyses_by_id.get(analysis_id, None)

    def get_by_protocol(self, protocol_id: str) -> Optional[PendingAnalysis]:
        """Return the pending analysis associated with the given protocol, if any."""
        analysis_id = self._analysis_ids_by_protocol_id.get(protocol_id, None)
        if analysis_id is None:
            return None
        else:
            return self._analyses_by_id[analysis_id]

    def get_protocol_id(self, analysis_id: str) -> Optional[str]:
        """Return the ID of the protocol that's associated with the given analysis."""
        return self._protocol_ids_by_analysis_id.get(analysis_id, None)


@dataclass
class _CompletedAnalysisResource:
    """A protocol analysis that's been completed, storable in a SQL database.

    See `_CompletedAnalysisStore`.
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
            return pickle.dumps(self.completed_analysis.dict())

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
        cls, sql_row: sqlalchemy.engine.Row
    ) -> _CompletedAnalysisResource:
        """Extract the data from a SQLAlchemy row object.

        This potentially involves heavy parsing, so it's offloaded to a worker thread.

        Avoid calling this from inside a SQL transaction, since it might be slow.
        """
        analyzer_version = sql_row.analyzer_version
        if analyzer_version != _CURRENT_ANALYZER_VERSION:
            _log.warning(
                f'Analysis in database was created under version "{analyzer_version}",'
                f' but we are version "{_CURRENT_ANALYZER_VERSION}".'
                f" This may cause compatibility problems."
            )
        assert isinstance(analyzer_version, str)

        id = sql_row.id
        assert isinstance(id, str)

        protocol_id = sql_row.protocol_id
        assert isinstance(protocol_id, str)

        def parse_completed_analysis() -> CompletedAnalysis:
            return CompletedAnalysis.parse_obj(pickle.loads(sql_row.completed_analysis))

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


class _CompletedAnalysisStore:
    """A SQL-backed persistent store of protocol analyses that are completed."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    async def get_by_id(self, analysis_id: str) -> Optional[_CompletedAnalysisResource]:
        """Return the analysis with the given ID, if it exists."""
        statement = sqlalchemy.select(analysis_table).where(
            analysis_table.c.id == analysis_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                result = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound:
                return None
        return await _CompletedAnalysisResource.from_sql_row(result)

    async def get_by_protocol(
        self, protocol_id: str
    ) -> List[_CompletedAnalysisResource]:
        """Return all analyses associated with the given protocol, oldest-added first.

        If protocol_id doesn't point to a valid protocol, returns an empty list;
        doesn't raise an error.
        """
        statement = (
            sqlalchemy.select(analysis_table)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()
        return [await _CompletedAnalysisResource.from_sql_row(r) for r in results]

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

    async def add(
        self, completed_analysis_resource: _CompletedAnalysisResource
    ) -> None:
        statement = analysis_table.insert().values(
            await completed_analysis_resource.to_sql_values()
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)


def _summarize_pending(pending_analysis: PendingAnalysis) -> AnalysisSummary:
    return AnalysisSummary(id=pending_analysis.id, status=pending_analysis.status)
