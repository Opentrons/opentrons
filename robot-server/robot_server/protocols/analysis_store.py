"""Protocol analysis storage."""
from __future__ import annotations


from logging import getLogger
from typing import Dict, List, Optional
from typing_extensions import Final
from opentrons_shared_data.robot.dev_types import RobotType

import sqlalchemy

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
    LoadedModule,
    Liquid,
)

from .analysis_models import (
    AnalysisSummary,
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
    AnalysisStatus,
)

from .completed_analysis_store import CompletedAnalysisStore, CompletedAnalysisResource
from .analysis_memcache import MemoryCache

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
#
# Version History
#     * Changed to "2" for version 7.0 from "initial"
_CURRENT_ANALYZER_VERSION: Final = "2"
# We have a reasonable limit for a memory cache of analyses.
_CACHE_MAX_SIZE: Final = 32


class AnalysisNotFoundError(ValueError):
    """Exception raised if a given analysis is not found."""

    def __init__(self, analysis_id: str) -> None:
        """Initialize the error's message."""
        super().__init__(f'Analysis "{analysis_id}" not found.')


# TODO(sf, 2023-05-05): Like for protocols and runs, there's an in-memory cache for
# elements of this store. Unlike for protocols and runs, it isn't just an lru_cache
# on the top-level store's access methods, because those access methods have to be
# async to handle the sql deserialization and lru_caches don't work with those. Also
# unlike protocols and runs, analyses have a dichotomy between in-progress analyses
# (which are all in memory) and completed analyses (which are persisted). So the
# in-memory cache is special, custom, and only really for the completed analyses.
#
# The todo is to make this reusable or more similar to run and protocol stores or
# just not part of the python side of this (via memcached or something) or just
# make this all fast enough to not need caching.


class AnalysisStore:
    """Storage interface for protocol analyses.

    Completed analyses (OK or NOT-OK) are saved to persistent storage.

    Pending analyses don't make sense to persist across reboots,
    so they're only kept in-memory, and lost when the store instance is destroyed.
    """

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize the `AnalysisStore`."""
        self._pending_store = _PendingAnalysisStore()
        self._completed_store = CompletedAnalysisStore(
            sql_engine=sql_engine,
            memory_cache=MemoryCache(_CACHE_MAX_SIZE, str, CompletedAnalysisResource),
            current_analyzer_version=_CURRENT_ANALYZER_VERSION,
        )

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
        robot_type: RobotType,
        commands: List[Command],
        labware: List[LoadedLabware],
        modules: List[LoadedModule],
        pipettes: List[LoadedPipette],
        errors: List[ErrorOccurrence],
        liquids: List[Liquid],
    ) -> None:
        """Promote a pending analysis to completed, adding details of its results.

        Args:
            analysis_id: The ID of the analysis to promote.
                Must point to a valid pending analysis.
            robot_type: See `CompletedAnalysis.robotType`.
            commands: See `CompletedAnalysis.commands`.
            labware: See `CompletedAnalysis.labware`.
            modules: See `CompletedAnalysis.modules`.
            pipettes: See `CompletedAnalysis.pipettes`.
            errors: See `CompletedAnalysis.errors`. Also used to infer whether
                the completed analysis result is `OK` or `NOT_OK`.
            liquids: See `CompletedAnalysis.liquids`.
            robot_type: See `CompletedAnalysis.robotType`.
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
            robotType=robot_type,
            commands=commands,
            labware=labware,
            modules=modules,
            pipettes=pipettes,
            errors=errors,
            liquids=liquids,
        )
        completed_analysis_resource = CompletedAnalysisResource(
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
            AnalysisNotFoundError: If there is no analysis with the given ID.
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

    async def get_as_document(self, analysis_id: str) -> str:
        """Get a single completed protocol analysis by its ID, as a pre-serialized JSON document.

        Raises:
            AnalysisNotFoundError: If there is no completed analysis with the given ID.
                Unlike `get()`, this is raised if the analysis exists, but is pending.
        """
        completed_analysis_document = await self._completed_store.get_by_id_as_document(
            analysis_id=analysis_id
        )
        if completed_analysis_document is not None:
            return completed_analysis_document
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


def _summarize_pending(pending_analysis: PendingAnalysis) -> AnalysisSummary:
    return AnalysisSummary(id=pending_analysis.id, status=pending_analysis.status)
