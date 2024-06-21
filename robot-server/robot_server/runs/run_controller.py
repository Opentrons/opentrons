"""Control an active run with Actions."""
import logging
from datetime import datetime
from typing import Optional
from opentrons.protocol_engine import ProtocolEngineError
from opentrons_shared_data.errors.exceptions import RoboticsInteractionError

from robot_server.service.task_runner import TaskRunner

from .engine_store import EngineStore
from .run_store import RunStore
from .action_models import RunAction, RunActionType

from opentrons.protocol_engine.types import DeckConfigurationType

from robot_server.service.notifications import RunsPublisher

log = logging.getLogger(__name__)


class RunActionNotAllowedError(RoboticsInteractionError):
    """Error raised when a given run action is not allowed."""


class RunController:
    """An interface to manage the side effects of requested run actions."""

    def __init__(
        self,
        run_id: str,
        task_runner: TaskRunner,
        engine_store: EngineStore,
        run_store: RunStore,
        runs_publisher: RunsPublisher,
    ) -> None:
        self._run_id = run_id
        self._task_runner = task_runner
        self._engine_store = engine_store
        self._run_store = run_store
        self._runs_publisher = runs_publisher

    def create_action(
        self,
        action_id: str,
        action_type: RunActionType,
        created_at: datetime,
        action_payload: Optional[DeckConfigurationType],
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
                if self._engine_store.run_was_started():
                    log.info(f'Resuming run "{self._run_id}".')
                    self._engine_store.play()
                else:
                    log.info(f'Starting run "{self._run_id}".')
                    # TODO(mc, 2022-05-13): engine_store.runner.run could raise
                    # the same errors as runner.play, but we are unable to catch them.
                    # This unlikely to occur in production, but should be addressed.

                    self._task_runner.run(
                        func=self._run_protocol_and_insert_result,
                        deck_configuration=action_payload,
                    )

            elif action_type == RunActionType.PAUSE:
                log.info(f'Pausing run "{self._run_id}".')
                self._engine_store.pause()

            elif action_type == RunActionType.STOP:
                log.info(f'Stopping run "{self._run_id}".')
                self._task_runner.run(self._engine_store.stop)

            elif action_type == RunActionType.RESUME_FROM_RECOVERY:
                self._engine_store.resume_from_recovery()

        except ProtocolEngineError as e:
            raise RunActionNotAllowedError(message=e.message, wrapping=[e]) from e

        self._run_store.insert_action(run_id=self._run_id, action=action)

        # TODO (spp, 2023-11-09): I think the response should also contain the action payload
        return action

    async def _run_protocol_and_insert_result(
        self, deck_configuration: DeckConfigurationType
    ) -> None:
        result = await self._engine_store.run(
            deck_configuration=deck_configuration,
        )
        self._run_store.update_run_state(
            run_id=self._run_id,
            summary=result.state_summary,
            commands=result.commands,
            run_time_parameters=result.parameters,
        )
        await self._runs_publisher.publish_pre_serialized_commands_notification(
            self._run_id
        )
