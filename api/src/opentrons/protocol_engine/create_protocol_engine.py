"""Main ProtocolEngine factory."""
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import DoorState

from .protocol_engine import ProtocolEngine
from .resources import DeckDataProvider
from .state import Config, StateStore


async def create_protocol_engine(
    hardware_api: HardwareControlAPI,
    config: Config,
) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
        config: ProtocolEngine configuration.
    """
    deck_data = DeckDataProvider()
    deck_definition = await deck_data.get_deck_definition()
    deck_fixed_labware = await deck_data.get_deck_fixed_labware(deck_definition)

    state_store = StateStore(
        config=config,
        deck_definition=deck_definition,
        deck_fixed_labware=deck_fixed_labware,
        is_door_open=hardware_api.door_state is DoorState.OPEN,
    )

    return ProtocolEngine(state_store=state_store, hardware_api=hardware_api)
