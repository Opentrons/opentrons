"""ProtocolContext factory."""

import asyncio
from typing import Dict, Optional, Union, cast

from Pyro5.api import Proxy

from .core.common import ProtocolCore as AbstractProtocolCore
from .core.engine import ProtocolCore
from .disposal_locations import TrashBin
from .protocol_context import ProtocolContext
from opentrons.hardware_control import (
    HardwareControlAPI,
    SynchronousAdapter,
    ThreadManager,
)
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.clients import ChildThreadTransport, SyncClient
from opentrons.protocols.api_support.deck_type import (
    should_load_fixed_trash_area_for_python_protocol,
)
from opentrons.protocols.api_support.definitions import (
    MAX_SUPPORTED_VERSION,
    MIN_SUPPORTED_VERSION,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject


def create_protocol_context(  # noqa: C901
    api_version: APIVersion,
    *,
    hardware_api: Union[HardwareControlAPI, ThreadManager[HardwareControlAPI]],
    deck_type: str,
    protocol_engine: ProtocolEngine,
    protocol_engine_loop: asyncio.AbstractEventLoop,
    broker: Optional[LegacyBroker] = None,
    bundled_data: Optional[Dict[str, bytes]] = None,
) -> ProtocolContext:
    """Create a ProtocolContext for use in a Python protocol.

    Args:
        api_version: The API version to target.
        hardware_api: Control interface to the device's hardware.
        deck_type: What kind of deck the device has.
            This must match the deck type in `protocol_engine`'s config, if there is one.
        protocol_engine: A ProtocolEngine to use for labware offsets
            and core protocol logic. If omitted, labware offsets will
            all be (0, 0, 0) and ProtocolEngine-based core will not work.
        protocol_engine_loop: An event loop running in the thread where
            ProtocolEngine mutations must occur.
        broker: A message broker for protocol command event publishing.
        bundled_data: Do not use in new code. Leftover from
            experimental ZIP protocol bundles.

    Returns:
        A ready-to-use ProtocolContext.
    """
    if api_version > MAX_SUPPORTED_VERSION:
        raise ValueError(
            f"API version {api_version} is not supported by this robot software."
            f" Please reduce your API version to {MAX_SUPPORTED_VERSION} or below"
            f" or update your robot."
        )

    if api_version < MIN_SUPPORTED_VERSION:
        raise ValueError(
            f"API version {api_version} is not supported by this robot software."
            f" Please increase your API version to {MIN_SUPPORTED_VERSION} or above"
            f" or downgrade your robot."
        )

    sync_hardware: SynchronousAdapter[HardwareControlAPI]

    if isinstance(hardware_api, ThreadManager):
        sync_hardware = hardware_api.sync
    elif hasattr(hardware_api, "_proxy"):
        # If this is an Async Client Pyro version of the hardware API, we reconstruct it to
        # force all the calls to be synchronous, allowing it to be easily used in the SynchronousAdapter
        with Proxy(hardware_api._proxy._pyroUri) as new_proxy:  # type: ignore[no-untyped-call]
            sync_acpo = AsyncClientPyroObject(new_proxy, force_synchronous=True)
            sync_hardware = SynchronousAdapter(sync_acpo)  # type: ignore[arg-type]
    else:
        sync_hardware = SynchronousAdapter(hardware_api)

    engine_client_transport = ChildThreadTransport(
        engine=protocol_engine, loop=protocol_engine_loop
    )
    engine_client = SyncClient(transport=engine_client_transport)
    core = ProtocolCore(
        engine_client=engine_client,
        api_version=api_version,
        sync_hardware=sync_hardware,
    )

    context = ProtocolContext(
        api_version=api_version,
        # TODO(mm, 2023-05-11): This cast shouldn't be necessary.
        # Fix this by making the appropriate TypeVars covariant?
        # https://peps.python.org/pep-0484/#covariance-and-contravariance
        core=cast(AbstractProtocolCore, core),
        broker=broker,
        bundled_data=bundled_data,
    )
    # If we're loading an engine based core into the context, and we're on api level 2.16 or above, on an OT-2 we need
    # to insert a fixed trash addressable area into the protocol engine, for correctness in anything that relies on
    # knowing what addressable areas have been loaded (and any checks involving trash geometry). Because the method
    # that uses this in the core relies on the sync client and this code will run in the main thread (which if called
    # will cause a deadlock), we're directly calling the protocol engine method here where we have access to it.
    if should_load_fixed_trash_area_for_python_protocol(
        api_version=api_version, robot_type=protocol_engine.state_view.config.robot_type
    ):
        assert isinstance(context.fixed_trash, TrashBin)
        protocol_engine.add_addressable_area(context.fixed_trash.area_name)
    return context
