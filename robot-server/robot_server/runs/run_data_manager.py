"""Manage current and historical run data."""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from opentrons.protocol_engine.errors import ProtocolEngineStoppedError
from opentrons.protocol_engine import LabwareOffsetCreate, ProtocolRunData
from opentrons.protocol_runner import PlayType

from robot_server.protocols import ProtocolResource
from robot_server.service.task_runner import TaskRunner

from .engine_store import EngineStore
from .run_store import RunResource, RunStore, RunNotFoundError, RunStateResource
from .run_models import Run
from .run_error_models import RunStoppedError, RunActionNotAllowedError
from .action_models import RunAction, RunActionType

log = logging.getLogger(__name__)


def _build_run(run_resource: RunResource, run_data: ProtocolRunData) -> Run:
    return Run.construct(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=run_data.status,
        errors=run_data.errors,
        labware=run_data.labware,
        labwareOffsets=run_data.labwareOffsets,
        pipettes=run_data.pipettes,
    )


class RunDataManager:
    """Collaborator to manage current and historical run data.

    Provides a facade to both an EngineStore (current run) and a RunStore
    (historical runs). Returns `Run` response models to the router.

    Args:
        engine_store: In-memory store the current run's ProtocolEngine.
        run_store: Persistent database of current and historical run data.
    """

    def __init__(
        self, engine_store: EngineStore, run_store: RunStore, task_runner: TaskRunner
    ) -> None:
        self._engine_store = engine_store
        self._run_store = run_store
        self._task_runner = task_runner

    @property
    def current_run_id(self) -> Optional[str]:
        """The identifier of the current run, if any."""
        raise NotImplementedError("TODO, maybe?")

    async def create(
        self,
        run_id: str,
        created_at: datetime,
        labware_offsets: List[LabwareOffsetCreate],
        protocol: Optional[ProtocolResource],
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
        # TODO(mc, 2022-05-10): fix race condition between
        # await engine create and set current run ID
        run_data = await self._engine_store.create(run_id)
        run_resource = self._run_store.insert(
            RunResource(
                run_id=run_id,
                created_at=created_at,
                protocol_id=protocol.protocol_id if protocol is not None else None,
                actions=[],
                is_current=True,
            )
        )

        return _build_run(run_resource, run_data)

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
        run_resource = self._run_store.get(run_id)

        if run_id == self._engine_store.current_run_id:
            run_data = self._engine_store.engine.state_view.get_protocol_run_data()
        else:
            run_data = self._run_store.get_run_data(run_id)

        return _build_run(run_resource, run_data)

    def get_all(self) -> List[Run]:
        """Get current and stored run resources.

        Returns:
            All run resources.
        """
        raise NotImplementedError("TODO")

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
        # handle engine missing without propagating to client
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

    def create_action(
        self,
        run_id: str,
        action_id: str,
        action_type: RunActionType,
        created_at: datetime,
    ) -> RunAction:
        """Create a run action.

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
        # try:
        #     prev_run = self.get(run_id=run_id)
        #     print("returned run: " + prev_run.id)
        # except RunNotFoundError:
        #     raise RunNotFoundError(run_id=run_id)

        # if not prev_run.current:
        #     raise RunStoppedError(run_id=run_id)

        # try:
        play_type = None

        if action_type == RunActionType.PLAY:
            play_type = self._engine_store.runner.play()
            log.info(f'Run "{run_id}" {play_type}\'d.')

        #     elif run_action.actionType == RunActionType.PAUSE:
        #         log.info(f'Pausing run "{run_id}".')
        #         self._engine_store.runner.pause()

        #     elif run_action.actionType == RunActionType.STOP:
        #         log.info(f'Stopping run "{run_id}".')
        #         self._task_runner.run(self._engine_store.runner.stop)

        # except ProtocolEngineStoppedError:
        #     raise RunActionNotAllowedError(run_id=run_id)

        # self._run_store.insert_action(run_id=run_id, action=run_action)

        if play_type == PlayType.START:
            self._task_runner.run(
                self._run_protocol_and_insert_result,
                run_id=run_id,
            )

        return RunAction(id=action_id, actionType=action_type, createdAt=created_at)

    async def _run_protocol_and_insert_result(self, run_id: str) -> None:
        log.info(f'Starting run "{run_id}".')

        result = await self._engine_store.runner.run()
        self._run_store.update_run_state(
            run_id=run_id,
            run_data=result.data,
            commands=result.commands,
        )
