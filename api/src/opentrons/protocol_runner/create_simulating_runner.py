"""Simulating ProtocolRunner factory."""

from opentrons.config import feature_flags
from opentrons.hardware_control import API as HardwareAPI, HardwareControlAPI
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
    create_protocol_engine,
)
from .legacy_wrappers import LegacySimulatingContextCreator
from .legacy_labware_offset_provider import LegacyLabwareOffsetProvider
from .protocol_runner import ProtocolRunner


async def create_simulating_runner() -> ProtocolRunner:
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
    if feature_flags.enable_ot3_hardware_controller():
        # Inline import because OT3API is not safe to import on an OT2 system
        from opentrons.hardware_control.ot3api import OT3API

        simulating_hardware_api: HardwareControlAPI = (
            await OT3API.build_hardware_simulator()
        )
    else:
        simulating_hardware_api = await HardwareAPI.build_hardware_simulator()

    # TODO(mc, 2021-08-25): move initial home to protocol engine
    await simulating_hardware_api.home()

    protocol_engine = await create_protocol_engine(
        hardware_api=simulating_hardware_api,
        config=ProtocolEngineConfig(
            ignore_pause=True,
            use_virtual_modules=True,
        ),
    )

    offset_provider = LegacyLabwareOffsetProvider(
        labware_view=protocol_engine.state_view.labware,
    )

    simulating_legacy_context_creator = (
        LegacySimulatingContextCreator(
            hardware_api=simulating_hardware_api,
            labware_offset_provider=offset_provider,
        )
        if not feature_flags.disable_fast_protocol_upload()
        else None
    )

    return ProtocolRunner(
        protocol_engine=protocol_engine,
        hardware_api=simulating_hardware_api,
        legacy_context_creator=simulating_legacy_context_creator,
    )
