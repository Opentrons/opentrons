"""Simulating AbstractRunner factory."""

from opentrons.hardware_control import API as OT2API, HardwareControlAPI
from opentrons.protocols.api_support import deck_type
from opentrons.protocols.api_support.deck_type import should_load_fixed_trash
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
    DeckType,
    error_recovery_policy,
)
from opentrons.protocol_engine.create_protocol_engine import create_protocol_engine
from opentrons.protocol_reader.protocol_source import ProtocolConfig

from opentrons_shared_data.robot.types import RobotType

from .python_protocol_wrappers import SimulatingContextCreator
from .run_orchestrator import RunOrchestrator
from .protocol_runner import create_protocol_runner, LiveRunner


async def create_simulating_orchestrator(
    robot_type: RobotType, protocol_config: ProtocolConfig
) -> RunOrchestrator:
    """Create a RunOrchestrator wired to a simulating HardwareControlAPI.

    Example:
        ```python
        from pathlib import Path
        from typing import List
        from opentrons.protocol_engine import Command
        from opentrons.protocol_runner import (
            ProtocolType,
            ProtocolFile,
            AbstractRunner,
            create_simulating_orchestrator,
        )

        protocol = ProtocolFile(
            protocol_type=ProtocolType.PYTHON,
            files=[Path("/path/to/protocol.py")],
        )
        orchestrator: RunOrchestrator = await create_simulating_orchestrator()
        commands: List[Command] = await orchestrator.run(protocol)
        ```
    """
    simulating_hardware_api = await _build_hardware_simulator_for_robot_type(
        robot_type=robot_type
    )

    # TODO(mm, 2024-08-06): This home has theoretically been replaced by Protocol Engine
    # `home` commands within the `RunOrchestrator` or `ProtocolRunner`. However, it turns
    # out that this `HardwareControlAPI`-level home is accidentally load-bearing,
    # working around Protocol Engine bugs where *both* layers need to be homed for
    # certain commands to work. https://opentrons.atlassian.net/browse/EXEC-646
    await simulating_hardware_api.home()

    protocol_engine = await create_protocol_engine(
        hardware_api=simulating_hardware_api,
        config=ProtocolEngineConfig(
            robot_type=robot_type,
            deck_type=DeckType(deck_type.for_simulation(robot_type)),
            ignore_pause=True,
            use_virtual_modules=True,
            use_virtual_gripper=True,
            use_simulated_deck_config=True,
            use_virtual_pipettes=True,
        ),
        error_recovery_policy=error_recovery_policy.never_recover,
        load_fixed_trash=should_load_fixed_trash(protocol_config),
    )

    simulating_context_creator = SimulatingContextCreator(
        hardware_api=simulating_hardware_api,
        protocol_engine=protocol_engine,
    )

    runner = create_protocol_runner(
        protocol_config=protocol_config,
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
        protocol_context_creator=simulating_context_creator,
    )

    setup_runner = LiveRunner(
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
    )

    fixit_runner = LiveRunner(
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
    )

    protocol_live_runner = LiveRunner(
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
    )

    return RunOrchestrator(
        hardware_api=simulating_hardware_api,
        json_or_python_protocol_runner=runner,
        protocol_engine=protocol_engine,
        setup_runner=setup_runner,
        fixit_runner=fixit_runner,
        protocol_live_runner=protocol_live_runner,
    )


async def _build_hardware_simulator_for_robot_type(
    robot_type: RobotType,
) -> HardwareControlAPI:
    if robot_type == "OT-2 Standard":
        return await OT2API.build_hardware_simulator()
    elif robot_type == "OT-3 Standard":
        # Inline import because OT3API is not present to import on an OT-2 system.
        from opentrons.hardware_control.ot3api import OT3API

        return await OT3API.build_hardware_simulator()
