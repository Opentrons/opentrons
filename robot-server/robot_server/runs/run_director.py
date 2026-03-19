"""A wrapper for a protocol run that lives as a proxy in its own process."""

from typing import Optional

import Pyro5.api

from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_process_types,
)
from opentrons.protocol_engine import DeckType
from opentrons.protocol_engine.state.state_summary import StateSummary
from opentrons.protocol_engine.types.execution import EngineStatus
from opentrons.protocol_engine.types.labware import LoadedLabware
from opentrons.protocol_engine.types.location import DeckSlotLocation
from opentrons.types import DeckSlotName
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons_shared_data.robot.types import RobotType


def create_directed_run_process(
    robot_type: RobotType,
    deck_type: DeckType,
) -> None:
    """Build an instance of the DirectedRunProcess and provide it to Pyro Daemon Factory as a resource."""
    directed_run_process = DirectedRunProcess(robot_type, deck_type)
    try:
        create_pyro_daemon("ot-protocol", directed_run_process, register_process_types)
    finally:
        pass


class DirectedRunProcess:
    """A wrapper of the engine and run orchestrator for a pyro process."""

    def __init__(
        self,
        robot_type: RobotType,
        deck_type: DeckType,
    ) -> None:
        self._robot_type = robot_type
        self._deck_type = deck_type
        self._run_id: Optional[str] = None

    def create(self, run_id: str) -> None:
        """Create a run orchestrator and protocol engine for a given run."""
        self._run_id = run_id

    @property
    def run_id(self) -> Optional[str]:
        return self._run_id

    def get_is_okay_to_clear(self) -> bool:
        return True

    def get_summary(self) -> StateSummary:
        # labware = LoadedLabware(
        #     id="abc",
        #     loadName="123",
        #     definitionUri="xyz",
        #     location=DeckSlotLocation(
        #         slotName=DeckSlotName.SLOT_A1,
        #     ),
        #     lid_id=None,
        #     offsetId=None,
        #     displayName=None,
        # )
        return StateSummary(
            status=EngineStatus.IDLE,
            errors=[],
            labware=[],
            pipettes=[],
            modules=[],
            labwareOffsets=[],
        )


if __name__ == "__main__":
    # TODO hard coding this for now since it's only gonna be on Flex
    create_directed_run_process("OT-3 Standard", DeckType.OT3_STANDARD)
