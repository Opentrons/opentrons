"""Main ProtocolEngine factory."""
from opentrons.hardware_control.api import API as HardwareAPI

from .protocol_engine import ProtocolEngine
from .resources import DeckDataProvider
from .state import StateStore, EngineConfigs


async def create_protocol_engine(
    hardware_api: HardwareAPI,
    configs: EngineConfigs = EngineConfigs(),
) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
        configs: Protocol Engine configurations.
    """
    # TODO(mc, 2020-11-18): check short trash FF
    deck_data = DeckDataProvider()
    deck_definition = await deck_data.get_deck_definition()
    deck_fixed_labware = await deck_data.get_deck_fixed_labware(deck_definition)

    # TODO(mc, 2021-09-22): figure out a better way to load deck data that
    # can more consistently handle Python vs JSON vs legacy differences
    state_store = StateStore(
        deck_definition=deck_definition,
        deck_fixed_labware=deck_fixed_labware,
        configs=configs,
    )

    return ProtocolEngine(state_store=state_store, hardware_api=hardware_api)
