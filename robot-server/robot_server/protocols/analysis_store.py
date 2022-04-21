"""Protocol analysis storage."""
from __future__ import annotations

from collections import defaultdict
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

from robot_server.persistence import analysis_table

from .analysis_models import (
    AnalysisSummary,
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
)


_log = getLogger(__name__)


_ANALYZER_VERSION = "TODO"


class AnalysisStore:
    """Storage interface for protocol analyses.

    Completed analyses are saved to persistent storage.

    Pending analyses don't make sense to persist across reboots,
    so those are kept in-memory and lost when the store instance is destroyed.
    """

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize the AnalysisStore's internal state."""
        self._sql_engine = sql_engine

        # To make it easier for us to preserve the correct order of analyses
        # when some are stored in the database and some are stored in-memory,
        # we only allow at most one pending analysis per protocol at a time.
        self._pending_analyses_by_protocol: Dict[str, PendingAnalysis] = {}

    def add_pending(self, protocol_id: str, analysis_id: str) -> PendingAnalysis:
        """Add a new pending analysis to the store.

        Parameters:
            protocol_id: The protocol to add an analysis to.
            analysis_id: The ID of the new analysis.
                Must be unique across *all* protocols, not just this one.

        Returns:
            The just-added analysis.
        """
        assert (
            protocol_id not in self._pending_analyses_by_protocol
        ), "Protocol already has a pending analysis."

        # For implementation simplicity, we don't check these assumptions:
        #   * The protocol_id must refer to a valid protocol.
        #   * The analysis_id must be unique across all protocols.

        pending_analysis = PendingAnalysis.construct(id=analysis_id)
        self._pending_analyses_by_protocol[protocol_id] = pending_analysis
        return pending_analysis

    def update(
        self,
        analysis_id: str,
        commands: List[Command],
        labware: List[LoadedLabware],
        pipettes: List[LoadedPipette],
        errors: List[ErrorOccurrence],
    ) -> None:
        """Promote a pending analysis to completed, adding details of its results."""
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

        protocol_id: Optional[str] = None

        # TODO(mm, 2021-04-20): This linear search is inefficient.
        for (
            protocol_id_candidate,
            pending_analysis,
        ) in self._pending_analyses_by_protocol.items():
            if pending_analysis.id == analysis_id:
                protocol_id = protocol_id_candidate
                break

        assert protocol_id is not None, "Can only update a pending analysis."

        completed_analysis_resource = _CompletedAnalysisResource(
            id=completed_analysis.id,
            protocol_id=protocol_id,
            analyzer_version=_ANALYZER_VERSION,
            completed_analysis=completed_analysis,
        )
        self._sql_add(completed_analysis_resource=completed_analysis_resource)

        del self._pending_analyses_by_protocol[protocol_id]

    def get_summaries_by_protocol(self, protocol_id: str) -> List[AnalysisSummary]:
        """Get summaries of all analyses for a protocol, in order from oldest first."""
        full_analyses = self.get_by_protocol(protocol_id)

        return [
            AnalysisSummary.construct(id=a.id, status=a.status) for a in full_analyses
        ]

    def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get all analyses for a protocol, in order from oldest first."""
        completed_analysis_resources = self._sql_get_by_protocol(
            protocol_id=protocol_id
        )
        # TODO: If version mismatch, log warning.
        completed_analyses: List[ProtocolAnalysis] = [
            resource.completed_analysis for resource in completed_analysis_resources
        ]

        pending_analyses: List[ProtocolAnalysis]
        try:
            pending_analyses = [self._pending_analyses_by_protocol[protocol_id]]
        except KeyError:
            pending_analyses = []

        return completed_analyses + pending_analyses

    def _sql_get_by_protocol(
        self, protocol_id: str
    ) -> List[_CompletedAnalysisResource]:
        statement = (
            analysis_table.select()
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlalchemy.column("_ROWID_"))
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()
        return [_CompletedAnalysisResource.from_sql_row(r) for r in results]

    def _sql_get_ids_by_protocol(self, protocol_id: str) -> List[str]:
        statement = (
            analysis_table.select(analysis_table.c.id)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlalchemy.column("_ROWID_"))
        )
        with self._sql_engine.begin() as transaction:
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
