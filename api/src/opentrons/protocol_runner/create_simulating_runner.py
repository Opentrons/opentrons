"""Simulating ProtocolRunner factory."""

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import create_protocol_engine
from .protocol_runner import ProtocolRunner


async def create_simulating_runner() -> ProtocolRunner:
    """Create a ProtocolRunner wired to a simulating HardwareAPI.

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
    simulating_hardware_api = await HardwareAPI.build_hardware_simulator()

    # TODO(mc, 2021-08-25): move initial home to protocol engine
    await simulating_hardware_api.home()

    # TODO(mc, 2021-08-25): this engine will not simulate pauses
    # https://github.com/Opentrons/opentrons/issues/8265
    protocol_engine = await create_protocol_engine(hardware_api=simulating_hardware_api)

    return ProtocolRunner(protocol_engine=protocol_engine)
