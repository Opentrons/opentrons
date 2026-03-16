"""A wrapper for a protocol run that lives as a proxy in its own process."""

from typing import Optional

from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.protocol_engine import DeckType
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryPolicy
from opentrons.protocol_runner import RunOrchestrator
from opentrons.util.pyro_daemon_utility import create_pyro_daemon
from opentrons_shared_data.robot.types import RobotType


def create_directed_run_process(
    robot_type: RobotType,
    deck_type: DeckType,
) -> None:
    """Build an instance of the DirectedRunProcess and provide it to Pyro Daemon Factory as a resource."""
    directed_run_process = DirectedRunProcess(robot_type, deck_type)
    try:
        create_pyro_daemon("ot-protocol", directed_run_process, register_hardware_types)
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
        self._run_orchestrator: Optional[RunOrchestrator] = None

    def create(
        self,
        error_recovery_policy: ErrorRecoveryPolicy,
    ) -> None:
        """Create a run orchestrator and protocol engine for a given run."""
        pass


if __name__ == "__main__":
    # TODO hard coding this for now since it's only gonna be on Flex
    create_directed_run_process("OT-3 Standard", DeckType.OT3_STANDARD)
