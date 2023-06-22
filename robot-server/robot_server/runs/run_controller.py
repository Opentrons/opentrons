"""Control an active run with Actions."""
import logging
from datetime import datetime

from opentrons.protocol_engine import ProtocolEngineError
from opentrons_shared_data.errors.exceptions import RoboticsInteractionError

from robot_server.service.task_runner import TaskRunner

from .engine_store import EngineStore
from .run_store import RunStore
from .action_models import RunAction, RunActionType


log = logging.getLogger(__name__)


class RunActionNotAllowedError(RoboticsInteractionError):
    """Error raised when a given run action is not allowed."""


class RunController:
    """An interface to manage the side-effects of requested run actions."""

    def __init__(
        self,
        run_id: str,
        task_runner: TaskRunner,
        engine_store: EngineStore,
        run_store: RunStore,
    ) -> None:
        self._run_id = run_id
        self._task_runner = task_runner
        self._engine_store = engine_store
        self._run_store = run_store

    def create_action(
        self,
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
            RunActionNotAllowed: The following operation is not allowed
        """
        assert (
            self._run_id == self._engine_store.current_run_id
        ), "Expected RunController to be bound to current run"

        action = RunAction(id=action_id, actionType=action_type, createdAt=created_at)

        try:
            if action_type == RunActionType.PLAY:
                if self._engine_store.runner.was_started():
                    log.info(f'Resuming run "{self._run_id}".')
                    self._engine_store.runner.play()
                else:
                    log.info(f'Starting run "{self._run_id}".')
                    # TODO(mc, 2022-05-13): engine_store.runner.run could raise
                    # the same errors as runner.play, but we are unable to catch them.
                    # This unlikely to occur in production, but should be addressed.
                    self._task_runner.run(self._run_protocol_and_insert_result)

            elif action_type == RunActionType.PAUSE:
                log.info(f'Pausing run "{self._run_id}".')
                self._engine_store.runner.pause()

            elif action_type == RunActionType.STOP:
                log.info(f'Stopping run "{self._run_id}".')
                self._task_runner.run(self._engine_store.runner.stop)

        except ProtocolEngineError as e:
            raise RunActionNotAllowedError(message=e.message, wrapping=[e]) from e

        self._run_store.insert_action(run_id=self._run_id, action=action)

        return action

    async def _run_protocol_and_insert_result(self) -> None:
        result = await self._engine_store.runner.run()
        self._run_store.update_run_state(
            run_id=self._run_id,
            summary=result.state_summary,
            commands=result.commands,
        )
