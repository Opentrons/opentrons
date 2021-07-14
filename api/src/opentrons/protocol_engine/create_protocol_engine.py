"""Main ProtocolEngine factory."""
from opentrons.hardware_control.api import API as HardwareAPI

from .protocol_engine import ProtocolEngine
from .resources import ResourceProviders
from .state import StateStore
from .commands import CommandMapper
from .execution import (
    CommandExecutor,
    EquipmentHandler,
    MovementHandler,
    PipettingHandler,
    QueueWorker,
)


async def create_protocol_engine(hardware: HardwareAPI) -> ProtocolEngine:
    """Create a ProtocolEngine instance."""
    resources = ResourceProviders()
    command_mapper = CommandMapper()

    # TODO(mc, 2020-11-18): check short trash FF
    # TODO(mc, 2020-11-18): consider moving into a StateStore.create factory
    deck_def = await resources.deck_data.get_deck_definition()
    fixed_labware = await resources.deck_data.get_deck_fixed_labware(deck_def)

    state_store = StateStore(
        deck_definition=deck_def,
        deck_fixed_labware=fixed_labware,
    )

    equipment_handler = EquipmentHandler(
        hardware=hardware,
        state_store=state_store,
        resources=resources,
    )

    movement_handler = MovementHandler(hardware=hardware, state_store=state_store)

    pipetting_handler = PipettingHandler(
        hardware=hardware,
        state_store=state_store,
        movement_handler=movement_handler,
    )

    command_executor = CommandExecutor(
        equipment=equipment_handler,
        movement=movement_handler,
        pipetting=pipetting_handler,
        resources=resources,
        command_mapper=command_mapper,
    )

    queue_worker = QueueWorker()

    return ProtocolEngine(
        state_store=state_store,
        command_executor=command_executor,
        command_mapper=command_mapper,
        resources=resources,
        queue_worker=queue_worker,
    )
