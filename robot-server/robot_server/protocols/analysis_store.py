"""Protocol analysis storage."""
from __future__ import annotations

from dataclasses import dataclass
from logging import getLogger
from typing import Dict, List, Optional

import sqlalchemy
from sqlalchemy.engine import Engine as SQLEngine, Row as SQLRow

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
)

from robot_server.persistence import analysis_table, protocol_table, sqlite_rowid

from .analysis_models import (
    AnalysisSummary,
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
    AnalysisStatus,
)

from .protocol_store import ProtocolNotFoundError


_log = getLogger(__name__)


_ANALYZER_VERSION = "TODO"


class AnalysisNotFoundError(ValueError):
    """Exception raised if a given analysis is not found."""

    def __init__(self, analysis_id: str) -> None:
        """Initialize the error's message."""
        super().__init__(f'Analysis "{analysis_id}" not found.')


class AnalysisNotPendingOrNotFoundError(ValueError):
    """Raised if a given analysis was expected to be pending, but isn't."""

    def __init__(self, analysis_id: str) -> None:
        """Initialize the error's message."""
        super().__init__(f'Analysis "{analysis_id}" does not exist or is not pending.')


class AnalysisStore:
    """Storage interface for protocol analyses.

    Completed analyses (succeeded or failed) are saved to persistent storage.

    Pending analyses don't make sense to persist across reboots,
    so they're only kept in-memory, and lost when the store instance is destroyed.
    """

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize the `AnalysisStore`."""
        self._sql_engine = sql_engine
        self._pending_analysis_store = _PendingAnalysisStore()

        self._pending_analyses_by_id: Dict[str, PendingAnalysis] = {}

        # We only store at most one pending analysis per protocol.
        # This makes it easier for us to preserve the correct order of analyses
        # when some are stored in the database and some are stored in-memory.
        # The in-memory pending one, if it exists, is always the most recent one.
        self._pending_analysis_ids_by_protocol: Dict[str, str] = {}

        _log.debug("Debug")
        _log.info("Info")
        _log.warning("Warning")
        _log.error("Error")

    def add_pending(self, protocol_id: str, analysis_id: str) -> AnalysisSummary:
        """Add a new pending analysis to the store.

        Parameters:
            protocol_id: The protocol to add the new pending analysis to.
                Must not already have a pending analysis.
            analysis_id: The ID of the new analysis.
                Must be unique across *all* protocols, not just this one.

                This uniqueness assumption is not checked here. If you violate it,
                this method will "succeed," but a future call to `update()` may fail
                unexpectedly because of a SQL uniqueness constraint violation.

        Returns:
            A summary of the just-added analysis.
        """
        with self._sql_engine.begin() as transaction:
            self._sql_check_protocol_exists(
                connection=transaction, protocol_id=protocol_id
            )
        new_pending_analysis = self._pending_analysis_store.add(
            protocol_id=protocol_id, analysis_id=analysis_id
        )
        return _summarize_pending(pending_analysis=new_pending_analysis)

    def update(
        self,
        analysis_id: str,
        commands: List[Command],
        labware: List[LoadedLabware],
        pipettes: List[LoadedPipette],
        errors: List[ErrorOccurrence],
    ) -> None:
        """Promote a pending analysis to completed, adding details of its results.

        Raises:
            AnalysisNotPendingOrNotFoundError
        """
        protocol_id = self._pending_analysis_store.get_protocol_id(
            analysis_id=analysis_id
        )

        if protocol_id is None:
            # No pending analysis with the given ID.
            # There might be a completed one, but you can't update completed analyses.
            raise AnalysisNotPendingOrNotFoundError(analysis_id=analysis_id)

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
        )
        completed_analysis_resource = _CompletedAnalysisResource(
            id=completed_analysis.id,
            protocol_id=protocol_id,
            analyzer_version=_ANALYZER_VERSION,
            completed_analysis=completed_analysis,
        )
        self._sql_add(completed_analysis_resource=completed_analysis_resource)

        self._pending_analysis_store.remove(analysis_id=analysis_id)

    def get(self, analysis_id: str) -> ProtocolAnalysis:
        """Get a single protocol analysis by its ID."""
        pending_analysis = self._pending_analysis_store.get(analysis_id=analysis_id)
        if pending_analysis is not None:
            return pending_analysis
        else:
            completed_analysis_resource = self._sql_get_by_id(analysis_id=analysis_id)
            completed_analysis = completed_analysis_resource.completed_analysis
            return completed_analysis

    def get_summaries_by_protocol(self, protocol_id: str) -> List[AnalysisSummary]:
        """Get summaries of all analyses for a protocol, in order from oldest first."""
        completed_analysis_ids = self._sql_get_ids_by_protocol(protocol_id=protocol_id)
        completed_analysis_summaries = [
            AnalysisSummary.construct(id=analysis_id, status=AnalysisStatus.COMPLETED)
            for analysis_id in completed_analysis_ids
        ]

        pending_analysis = self._pending_analysis_store.get_by_protocol(
            protocol_id=protocol_id
        )
        if pending_analysis is None:
            return completed_analysis_summaries
        else:
            return completed_analysis_summaries + [_summarize_pending(pending_analysis)]

    def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get all analyses for a protocol, in order from oldest first."""
        completed_analysis_resources = self._sql_get_by_protocol(
            protocol_id=protocol_id
        )
        completed_analyses: List[ProtocolAnalysis] = [
            resource.completed_analysis for resource in completed_analysis_resources
        ]

        pending_analysis = self._pending_analysis_store.get_by_protocol(
            protocol_id=protocol_id
        )

        if pending_analysis is None:
            return completed_analyses
        else:
            return completed_analyses + [pending_analysis]

    def _sql_get_by_id(self, analysis_id: str) -> _CompletedAnalysisResource:
        statement = sqlalchemy.select(analysis_table).where(
            analysis_table.c.id == analysis_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                result = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise AnalysisNotFoundError(analysis_id=analysis_id)
        return _CompletedAnalysisResource.from_sql_row(result)

    def _sql_get_by_protocol(
        self, protocol_id: str
    ) -> List[_CompletedAnalysisResource]:
        statement = (
            sqlalchemy.select(analysis_table)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            self._sql_check_protocol_exists(
                connection=transaction, protocol_id=protocol_id
            )
            results = transaction.execute(statement).all()
        return [_CompletedAnalysisResource.from_sql_row(r) for r in results]

    def _sql_get_ids_by_protocol(self, protocol_id: str) -> List[str]:
        statement = (
            sqlalchemy.select(analysis_table.c.id)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            self._sql_check_protocol_exists(
                connection=transaction, protocol_id=protocol_id
            )
            results = transaction.execute(statement).all()

        result_ids: List[str] = []
        for row in results:
            assert isinstance(row.id, str)
            result_ids.append(row.id)

        return result_ids

    def _sql_add(self, completed_analysis_resource: _CompletedAnalysisResource) -> None:
        statement = analysis_table.insert().values(
            completed_analysis_resource.to_sql_values()
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

    @staticmethod
    def _sql_check_protocol_exists(
        connection: sqlalchemy.engine.Connection, protocol_id: str
    ) -> None:
        statement = sqlalchemy.select(
            # Thrown away. Dummy column just to have something small to select.
            protocol_table.c.id
        ).where(protocol_table.c.id == protocol_id)
        results = connection.execute(statement)
        try:
            results.one()
        except sqlalchemy.exc.NoResultFound as e:
            raise ProtocolNotFoundError(protocol_id=protocol_id) from e


class _PendingAnalysisStore:
    """An in-memory store of pending analyses."""

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
    id: str
    protocol_id: str
    analyzer_version: str
    completed_analysis: CompletedAnalysis

    def to_sql_values(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "protocol_id": self.protocol_id,
            "analyzer_version": self.analyzer_version,
            # TODO: Offload to thread?
            "completed_analysis": self.completed_analysis.json(),
        }

    @classmethod
    def from_sql_row(cls, sql_row: SQLRow) -> _CompletedAnalysisResource:
        analyzer_version = sql_row.analyzer_version
        if analyzer_version != _ANALYZER_VERSION:
            _log.warning(
                f'Analysis in database was created under version "{analyzer_version}",'
                f' but we are version "{_ANALYZER_VERSION}".'
                f" This may cause compatibility problems."
            )
        assert isinstance(analyzer_version, str)

        id = sql_row.id
        assert isinstance(id, str)

        protocol_id = sql_row.protocol_id
        assert isinstance(protocol_id, str)

        # TODO: Offload to thread?
        completed_analysis = CompletedAnalysis.parse_raw(sql_row.completed_analysis)

        return cls(
            id=id,
            protocol_id=protocol_id,
            analyzer_version=analyzer_version,
            completed_analysis=completed_analysis,
        )


def _summarize_pending(pending_analysis: PendingAnalysis) -> AnalysisSummary:
    return AnalysisSummary(id=pending_analysis.id, status=pending_analysis.status)
