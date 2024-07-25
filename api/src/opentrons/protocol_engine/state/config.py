"""Top-level ProtocolEngine configuration options."""
from dataclasses import dataclass

from opentrons_shared_data.robot.types import RobotType

from opentrons.protocol_engine.types import DeckType


@dataclass(frozen=True)
class Config:
    """ProtocolEngine configuration options.

    Params:
        robot_type: What kind of robot the engine is controlling,
            or pretending to control.
        deck_type: The type of deck on the robot that the engine is controlling,
            or pretending to control.
        ignore_pause: The engine should no-op instead of waiting
            for pauses and delays to complete.
        use_virtual_pipettes: The engine should no-op instead of calling
            instruments' hardware control API
        use_virtual_modules: The engine should no-op instead of calling
            modules' hardware control API.
        use_virtual_gripper: The engine should no-op instead of calling
            gripper hardware control API.
        use_simulated_deck_config: The engine should lazily populate the deck
            configuration instead of loading a provided configuration
        block_on_door_open: Protocol execution should pause if the
            front door is opened.
    """

    robot_type: RobotType
    deck_type: DeckType
    ignore_pause: bool = False
    use_virtual_pipettes: bool = False
    use_virtual_modules: bool = False
    use_virtual_gripper: bool = False
    use_simulated_deck_config: bool = False
    block_on_door_open: bool = False
