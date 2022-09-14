"""ProtocolContext factory."""
import asyncio
from typing import Any, Dict, Optional, Union

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.broker import Broker
from opentrons.equipment_broker import EquipmentBroker
from opentrons.config import feature_flags
from opentrons.hardware_control import (
    HardwareControlAPI,
    ThreadManager,
    SynchronousAdapter,
)
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.clients import SyncClient, ChildThreadTransport
from opentrons.protocols.api_support.types import APIVersion

from .protocol_context import ProtocolContext


from .core.protocol import AbstractProtocol
from .core.protocol_api.protocol_context import ProtocolContextImplementation
from .core.protocol_api.labware_offset_provider import (
    AbstractLabwareOffsetProvider,
    LabwareOffsetProvider,
    NullLabwareOffsetProvider,
)
from .core.simulator.protocol_context import ProtocolContextSimulation
from .core.engine import ProtocolCore


def create_protocol_context(
    api_version: APIVersion,
    *,
    hardware_api: Union[HardwareControlAPI, ThreadManager[HardwareControlAPI]],
    protocol_engine: Optional[ProtocolEngine] = None,
    protocol_engine_loop: Optional[asyncio.AbstractEventLoop] = None,
    broker: Optional[Broker] = None,
    equipment_broker: Optional[EquipmentBroker[Any]] = None,
    use_simulating_core: bool = False,
    extra_labware: Optional[Dict[str, LabwareDefinition]] = None,
    bundled_labware: Optional[Dict[str, LabwareDefinition]] = None,
    bundled_data: Optional[Dict[str, bytes]] = None,
) -> ProtocolContext:
    """Create a ProtocolContext for use in a Python protocol.

    Args:
        api_version: The API version to target.
        hardware_api: Control interface to the device's hardware.
        protocol_engine: A ProtocolEngine to use for labware offsets
            and core protocol logic. If omitted, labware offsets will
            all be (0, 0, 0) and ProtocolEngine-based core will not work.
        protocol_engine_loop: An event loop running in the thread where
            ProtocolEngine mutations must occur.
        broker: A message broker for protocol command event publishing.
        equipment_broker: A message broker for equipment load event publishing.
        use_simulating_core: For pre-ProtocolEngine API versions,
            use a simulating protocol core that will skip _most_ calls
            to the `hardware_api`.
        extra_labware: Extra labware definitions to include in
            labware definition lookup paths.
        bundled_labware: Do not use in new code. Leftover from
            experimental ZIP protocol bundles.
        bundled_data: Do not use in new code. Leftover from
            experimental ZIP protocol bundles.

    Returns:
        A ready-to-use ProtocolContext.
    """
    sync_hardware: SynchronousAdapter[HardwareControlAPI]
    labware_offset_provider: AbstractLabwareOffsetProvider
    core: AbstractProtocol[Any, Any, Any]

    if isinstance(hardware_api, ThreadManager):
        sync_hardware = hardware_api.sync
    else:
        sync_hardware = SynchronousAdapter(hardware_api)

    if protocol_engine is not None:
        labware_offset_provider = LabwareOffsetProvider(engine=protocol_engine)
    else:
        labware_offset_provider = NullLabwareOffsetProvider()

    # TODO(mc, 2022-8-22): replace with API version check
    if feature_flags.enable_protocol_engine_papi_core():
        # TODO(mc, 2022-8-22): replace assertion with strict typing
        assert (
            protocol_engine is not None and protocol_engine_loop is not None
        ), "ProtocolEngine PAPI core is enabled, but no ProtocolEngine given."

        engine_client_transport = ChildThreadTransport(
            engine=protocol_engine, loop=protocol_engine_loop
        )
        engine_client = SyncClient(transport=engine_client_transport)
        core = ProtocolCore(engine_client=engine_client)

    # TODO(mc, 2022-8-22): remove `disable_fast_protocol_upload`
    elif use_simulating_core and not feature_flags.disable_fast_protocol_upload():
        core = ProtocolContextSimulation(
            sync_hardware=sync_hardware,
            labware_offset_provider=labware_offset_provider,
            equipment_broker=equipment_broker,
            api_version=api_version,
            bundled_labware=bundled_labware,
            bundled_data=bundled_data,
            extra_labware=extra_labware,
        )

    else:
        core = ProtocolContextImplementation(
            sync_hardware=sync_hardware,
            labware_offset_provider=labware_offset_provider,
            equipment_broker=equipment_broker,
            api_version=api_version,
            bundled_labware=bundled_labware,
            bundled_data=bundled_data,
            extra_labware=extra_labware,
        )

    return ProtocolContext(api_version=api_version, broker=broker, implementation=core)
