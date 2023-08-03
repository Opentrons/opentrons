"""Background task to drive the status bar."""
from typing import Optional
from logging import getLogger
import asyncio
from dataclasses import dataclass

from .engine_store import EngineStore
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.types import EngineStatus
from opentrons.hardware_control.types import StatusBarState, EstopState

log = getLogger(__name__)


@dataclass
class Status:
    """Class to encapsulate overall status of the system as it pertains to the light control task."""

    estop_status: EstopState
    engine_status: Optional[EngineStatus]


def _engine_status_to_status_bar(status: Optional[EngineStatus]) -> StatusBarState:
    """Convert an engine status into a status bar status."""
    if status is None:
        return StatusBarState.IDLE

    return {
        EngineStatus.IDLE: StatusBarState.IDLE,
        EngineStatus.RUNNING: StatusBarState.RUNNING,
        EngineStatus.PAUSED: StatusBarState.PAUSED,
        EngineStatus.BLOCKED_BY_OPEN_DOOR: StatusBarState.PAUSED,
        EngineStatus.STOP_REQUESTED: StatusBarState.UPDATING,
        EngineStatus.STOPPED: StatusBarState.IDLE,
        EngineStatus.FINISHING: StatusBarState.UPDATING,
        EngineStatus.FAILED: StatusBarState.HARDWARE_ERROR,
        EngineStatus.SUCCEEDED: StatusBarState.RUN_COMPLETED,
    }[status]


class LightController:
    """LightController sets the status bar to match the protocol status."""

    def __init__(
        self, api: HardwareControlAPI, engine_store: Optional[EngineStore]
    ) -> None:
        """Create a new LightController."""
        self._api = api
        self._engine_store = engine_store

    def update_engine_store(self, engine_store: EngineStore) -> None:
        """Provide a handle to an EngineStore for the light control task."""
        self._engine_store = engine_store

    async def update(self, prev_status: Status, new_status: Status) -> None:
        """Update the status bar if the current run status has changed."""
        if prev_status == new_status:
            # No change, don't try to set anything.
            return

        if new_status.estop_status == EstopState.PHYSICALLY_ENGAGED:
            # Estop takes precedence
            await self._api.set_status_bar_state(state=StatusBarState.SOFTWARE_ERROR)
        else:
            await self._api.set_status_bar_state(
                state=_engine_status_to_status_bar(status=new_status.engine_status)
            )

    def _get_current_engine_status(self) -> Optional[EngineStatus]:
        """Get the `status` value from the engine's active run engine."""
        if self._engine_store is None:
            return None
        current_id = self._engine_store.current_run_id
        if current_id is not None:
            return self._engine_store.engine.state_view.commands.get_status()

        return None

    def get_current_status(self) -> Status:
        """Get the overall status of the system for light purposes."""
        return Status(
            estop_status=self._api.get_estop_state(),
            engine_status=self._get_current_engine_status(),
        )


async def run_light_task(driver: LightController) -> None:
    """Run the light control task.

    This is intended to be run as a background task once the EngineStore has been created.
    """
    prev_status = driver.get_current_status()
    while True:
        await asyncio.sleep(0.1)
        new_status = driver.get_current_status()
        await driver.update(prev_status=prev_status, new_status=new_status)
        prev_status = new_status
