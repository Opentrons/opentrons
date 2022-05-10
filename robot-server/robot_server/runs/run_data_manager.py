"""Manage current and historical run data."""
from datetime import datetime
from typing import List, Optional

from opentrons.protocol_engine import LabwareOffsetCreate

from robot_server.protocols import ProtocolResource
from .engine_store import EngineStore
from .run_store import RunStore

from .run_models import Run
from .action_models import RunAction, RunActionType, RunActionCreate

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

    def create_run_action(self, run_id: str, run_action: RunAction) -> None:
        """"Create a run action.

        Arg:
            run_id: The run associated to the action.
            create_action: Action to create.

        Returns:
            The action that was created.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
            RunStopped: The given run is not the current run.
            RunActionNotAllowed: The following operation is not allowed
        """
        raise NotImplementedError("TODO")
        # try:
        #     prev_run = get(run_id=runId)
        # except RunNotFoundError as e:
        #     raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)
        #
        # if not prev_run.is_current:
        #     raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
        #         status.HTTP_409_CONFLICT
        #     )
        # try:
        #     if action.actionType == RunActionType.PLAY:
        #         # TODO(mc, 2022-01-11): this won't work very well for HTTP-only
        #         # runs, which is ok at the time of writing but needs to be addressed
        #         if engine_store.runner.was_started():
        #             log.info(f'Resuming run "{runId}".')
        #             engine_store.runner.play()
        #         else:
        #             log.info(f'Starting run "{runId}".')
        #
        #             async def run_protocol_and_insert_result() -> None:
        #                 run_result = await engine_store.runner.run()
        #                 engine_status = engine_store.engine.state_view.commands.get_status()
        #                 run_state_resource = RunStateResource(
        #                     run_id=runId,
        #                     state=run_result,
        #                     engine_status=engine_status,
        #                     _updated_at=datetime.now(tz=timezone.utc),
        #                     commands=[],
        #                 )
        #                 run_store.update_run_state(run_state_resource)
        #
        #             task_runner.run(run_protocol_and_insert_result)
        #
        #     elif action.actionType == RunActionType.PAUSE:
        #         log.info(f'Pausing run "{runId}".')
        #         engine_store.runner.pause()
        #
        #     elif action.actionType == RunActionType.STOP:
        #         log.info(f'Stopping run "{runId}".')
        #         task_runner.run(engine_store.runner.stop)
        #
        # except ProtocolEngineStoppedError as e:
        #     raise RunActionNotAllowed(detail=str(e)).as_error(status.HTTP_409_CONFLICT)
        #
        # run_store.insert_action(run_id=runId, action=action)