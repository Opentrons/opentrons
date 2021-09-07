"""Main ProtocolEngine factory."""
from opentrons.hardware_control.api import API as HardwareAPI

from .protocol_engine import ProtocolEngine
from .state import create_state_store
from .execution import create_queue_worker


async def create_protocol_engine(hardware_api: HardwareAPI) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
    """
    state_store = await create_state_store()

    queue_worker = create_queue_worker(
        hardware_api=hardware_api,
        state_store=state_store,
    )

    return ProtocolEngine(
        state_store=state_store,
        queue_worker=queue_worker,
        hardware_api=hardware_api,
    )
