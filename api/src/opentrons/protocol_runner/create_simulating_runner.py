"""Simulating ProtocolRunner factory."""

from typing_extensions import Literal

from opentrons.config import feature_flags
from opentrons.hardware_control import API as OT2API, HardwareControlAPI
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
    create_protocol_engine,
)

from .legacy_wrappers import LegacySimulatingContextCreator
from .protocol_runner import ProtocolRunner


# TODO(mm, 2022-11-17): Make this a shared enum somewhere.
_RobotType = Literal["OT-2 Standard", "OT-3 Standard"]


async def create_simulating_runner(robot_type: _RobotType) -> ProtocolRunner:
    """Create a ProtocolRunner wired to a simulating HardwareControlAPI.

    Example:
        ```python
        from pathlib import Path
        from typing import List
        from opentrons.protocol_engine import Command
        from opentrons.protocol_runner import (
            ProtocolType,
            ProtocolFile,
            ProtocolRunner,
            create_simulating_runner,
        )

        protocol = ProtocolFile(
            protocol_type=ProtocolType.PYTHON,
            files=[Path("/path/to/protocol.py")],
        )
        runner: ProtocolRunner = await create_simulating_runner()
        commands: List[Command] = await runner.run(protocol)
        ```
    """
    simulating_hardware_api = await _build_hardware_simulator_for_robot_type(
        robot_type=robot_type
    )

    # TODO(mc, 2021-08-25): move initial home to protocol engine
    await simulating_hardware_api.home()

    protocol_engine = await create_protocol_engine(
        hardware_api=simulating_hardware_api,
        config=ProtocolEngineConfig(
            ignore_pause=True,
            use_virtual_modules=True,
            use_virtual_gripper=True,
        ),
    )

    simulating_legacy_context_creator = LegacySimulatingContextCreator(
        hardware_api=simulating_hardware_api,
        protocol_engine=protocol_engine,
    )

    return ProtocolRunner(
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
        legacy_context_creator=simulating_legacy_context_creator,
    )


async def _build_hardware_simulator_for_robot_type(
    robot_type: _RobotType,
) -> HardwareControlAPI:
    if robot_type == "OT-2 Standard":
        return await OT2API.build_hardware_simulator()
    elif robot_type == "OT-3 Standard":
        # Inline import because OT3API is not present to import on an OT-2 system.
        from opentrons.hardware_control.ot3api import OT3API

        return await OT3API.build_hardware_simulator()
