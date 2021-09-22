"""Main ProtocolEngine factory."""
from opentrons.hardware_control.api import API as HardwareAPI

from .protocol_engine import ProtocolEngine
from .state import create_state_store


async def create_protocol_engine(hardware_api: HardwareAPI) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
    """
    state_store = await create_state_store()

    return ProtocolEngine(state_store=state_store, hardware_api=hardware_api)
