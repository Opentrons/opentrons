"""Manage current and historical run data."""
from datetime import datetime
from typing import List, Optional

from opentrons.protocol_engine import LabwareOffsetCreate

from robot_server.protocols import ProtocolResource
from .engine_store import EngineStore
from .run_store import RunStore

from .run_models import Run


class RunDataManager:
    """Collaborator to manage current and historical run data.

    Provides a facade to both an EngineStore (current run) and a RunStore
    (historical runs). Returns `Run` response models to the router.

    Args:
        engine_store: In-memory store the current run's ProtocolEngine.
        run_store: Persistent database of current and historical run data.
    """

    def __init__(self, engine_store: EngineStore, run_store: RunStore) -> None:
        self._engine_store = engine_store
        self._run_store = run_store

    async def create(
        self,
        run_id: str,
        created_at: datetime,
        labware_offsets: List[LabwareOffsetCreate],
        protocol: Optional[ProtocolResource] = None,
    ) -> Run:
        """Create a new, current run.

        Args:
            run_id: Identifier to assign the new run.
            created_at: Creation datetime.
            labware_offsets: Labware offsets to initialize the engine with.

        Returns:
            The run resource.

        Raise:
            EngineConflictError: There is a currently active run that cannot
                be superceded by this new run.
        """
        raise NotImplementedError("TODO")
        # Create a row in the run table
        # Create a current engine in the engine store
        # Add labware offsets to current engine
        # Stitch together run resource and run data into `Run` model`

    def get(self, run_id: str) -> Run:
        """Get a run resource.

        This method will pull from the current run or the historical runs,
        depending on if `run_id` refers to the current run.

        Args:
            run_id: The identifier of the run to return.

        Returns:
            The run resource.

        Raises:
            RunNotFoundError: The given run identifier does not exist.
        """
        raise NotImplementedError("TODO")

    def get_all(self) -> List[Run]:
        """Get current and stored run resources.

        Returns:
            All run resources.
        """
        raise NotImplementedError("TODO")

    def get_current_run_id(self) -> Optional[str]:
        """Get the identifier of the current run, if any."""
        raise NotImplementedError("TODO")
        #  current_id = next((run.id for run in data if run.current is True), None)

    async def delete(self, run_id: str) -> None:
        """Delete a current or historical run.

        Args:
            run_id: The identifier of the run to remove.

        Raises:
            EngineConflictError: If deleting the current run, the current run
                is not idle and cannot be deleted.
            RunNotFoundError: The given run identifier was not found in the database.
        """
        raise NotImplementedError("TODO")
        # await engine_store.clear()
        # handle engine missing without propogating to client
        # run_store.remove(run_id=runId)

    async def get_or_archive(self, run_id: str, archive: bool) -> Run:
        """Get and potentially archive a run.

        Args:
            run_id: The run to get and maybe archive.

        Returns:
            The updated run.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
            RunStopped: The given run is not the current run.
        """
        raise NotImplementedError("TODO")
        # if update.current is False:
        #     run_data = engine_store.archive(runId)
        #     run_resource = run_store.update(run_id=runId, is_current=False)

        # else:
        #     run_data = engine_store.get(runId)
        #     run_resource = run_store.get(run_id=runId)
        #     if run_resource.is_current is False:
        #       raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
        #             status.HTTP_409_CONFLICT
        #         )
