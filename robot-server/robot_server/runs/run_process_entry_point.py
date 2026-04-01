"""This file is run directly in its own process and encapsulates a run."""

from opentrons.protocol_engine import DeckType
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons_shared_data.robot.types import RobotType

from robot_server.runs.run_process import DirectedRunProcess, register_process_types


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


if __name__ == "__main__":
    # TODO hard coding this for now since it's only gonna be on Flex
    create_directed_run_process("OT-3 Standard", DeckType.OT3_STANDARD)
