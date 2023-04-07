"""Control an active run with Actions."""
import logging
from datetime import datetime

from opentrons.protocol_engine import ProtocolEngineError

from robot_server.service.task_runner import TaskRunner

from .engine_store import EngineStore
from .maintenance_action_models import MaintenanceRunAction, MaintenanceRunActionType


log = logging.getLogger(__name__)


class RunActionNotAllowedError(ValueError):
    """Error raised when a given run action is not allowed."""


class MaintenanceRunController:
    """An interface to manage the side-effects of requested run actions."""

    def __init__(
        self,
        run_id: str,
        task_runner: TaskRunner,
        engine_store: EngineStore,
    ) -> None:
        self._run_id = run_id
        self._task_runner = task_runner
        self._engine_store = engine_store

    def create_action(
        self,
        action_id: str,
        action_type: MaintenanceRunActionType,
        created_at: datetime,
    ) -> MaintenanceRunAction:
        """Create a run action.

        Arg:
            run_id: The run associated to the action.
            create_action: Action to create.

        Returns:
            The action that was created.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
            RunActionNotAllowed: The following operation is not allowed
        """
        assert (
            self._run_id == self._engine_store.current_run_id
        ), "Expected RunController to be bound to current run"

        action = MaintenanceRunAction(
            id=action_id, actionType=action_type, createdAt=created_at
        )

        try:
            if action_type == MaintenanceRunActionType.STOP:
                log.info(f'Stopping run "{self._run_id}".')
                self._task_runner.run(self._engine_store.runner.stop)

        except ProtocolEngineError as e:
            raise RunActionNotAllowedError(str(e)) from e

        return action

    # async def _run_protocol_and_insert_result(self) -> None:
    #     result = await self._engine_store.runner.run()
    #     self._run_store.update_run_state(
    #         run_id=self._run_id,
    #         summary=result.state_summary,
    #         commands=result.commands,
    #     )
