"""Main ProtocolEngine factory."""
import asyncio
import contextlib
import typing

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import DoorState
from opentrons.util.async_helpers import async_context_manager_in_thread

from .protocol_engine import ProtocolEngine
from .resources import DeckDataProvider, ModuleDataProvider
from .state import Config, StateStore
from .types import PostRunHardwareState, DeckConfigurationType


# TODO(mm, 2023-06-16): Arguably, this not being a context manager makes us prone to forgetting to
# clean it up properly, especially in tests. See e.g. https://opentrons.atlassian.net/browse/RSS-222
async def create_protocol_engine(
    hardware_api: HardwareControlAPI,
    config: Config,
    load_fixed_trash: bool = False,
    deck_configuration: typing.Optional[DeckConfigurationType] = None,
) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
        config: ProtocolEngine configuration.
        load_fixed_trash: Automatically load fixed trash labware in engine.
        deck_configuration: The initial deck configuration the engine will be instantiated with.
    """
    deck_data = DeckDataProvider(config.deck_type)
    deck_definition = await deck_data.get_deck_definition()
    deck_fixed_labware = (
        await deck_data.get_deck_fixed_labware(deck_definition)
        if load_fixed_trash
        else []
    )
    module_calibration_offsets = ModuleDataProvider.load_module_calibrations()

    state_store = StateStore(
        config=config,
        deck_definition=deck_definition,
        deck_fixed_labware=deck_fixed_labware,
        is_door_open=hardware_api.door_state is DoorState.OPEN,
        module_calibration_offsets=module_calibration_offsets,
        deck_configuration=deck_configuration,
    )

    return ProtocolEngine(state_store=state_store, hardware_api=hardware_api)


@contextlib.contextmanager
def create_protocol_engine_in_thread(
    hardware_api: HardwareControlAPI,
    config: Config,
    drop_tips_after_run: bool,
    post_run_hardware_state: PostRunHardwareState,
    load_fixed_trash: bool = False,
) -> typing.Generator[
    typing.Tuple[ProtocolEngine, asyncio.AbstractEventLoop], None, None
]:
    """Run a `ProtocolEngine` in a worker thread.

    When this context manager is entered, it:

    1. Starts a worker thread.
    2. Starts an asyncio event loop in that worker thread.
    3. Creates and `.play()`s a `ProtocolEngine` in that event loop.
    4. Returns the `ProtocolEngine` and the event loop.
       Use functions like `asyncio.run_coroutine_threadsafe()` to safely interact with
       the `ProtocolEngine` from your thread.

    When this context manager is exited, it:

    1. Cleans up the `ProtocolEngine`.
    2. Stops and cleans up the event loop.
    3. Joins the thread.
    """
    with async_context_manager_in_thread(
        _protocol_engine(
            hardware_api,
            config,
            drop_tips_after_run,
            post_run_hardware_state,
            load_fixed_trash,
        )
    ) as (
        protocol_engine,
        loop,
    ):
        yield protocol_engine, loop


@contextlib.asynccontextmanager
async def _protocol_engine(
    hardware_api: HardwareControlAPI,
    config: Config,
    drop_tips_after_run: bool,
    post_run_hardware_state: PostRunHardwareState,
    load_fixed_trash: bool = False,
) -> typing.AsyncGenerator[ProtocolEngine, None]:
    protocol_engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=config,
        load_fixed_trash=load_fixed_trash,
    )
    try:
        protocol_engine.play()
        yield protocol_engine
    finally:
        await protocol_engine.finish(
            drop_tips_after_run=drop_tips_after_run,
            post_run_hardware_state=post_run_hardware_state,
        )
