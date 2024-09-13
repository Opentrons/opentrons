"""Main ProtocolEngine factory."""
import asyncio
import contextlib
import typing

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import DoorState
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryPolicy
from opentrons.util.async_helpers import async_context_manager_in_thread
from opentrons_shared_data.robot import load as load_robot

from .protocol_engine import ProtocolEngine
from .resources import DeckDataProvider, ModuleDataProvider
from .state import Config, StateStore
from .types import PostRunHardwareState, DeckConfigurationType

from .engine_support import create_run_orchestrator


# TODO(mm, 2023-06-16): Arguably, this not being a context manager makes us prone to forgetting to
# clean it up properly, especially in tests. See e.g. https://opentrons.atlassian.net/browse/RSS-222
async def create_protocol_engine(
    hardware_api: HardwareControlAPI,
    config: Config,
    error_recovery_policy: ErrorRecoveryPolicy,
    load_fixed_trash: bool = False,
    deck_configuration: typing.Optional[DeckConfigurationType] = None,
    notify_publishers: typing.Optional[typing.Callable[[], None]] = None,
) -> ProtocolEngine:
    """Create a ProtocolEngine instance.

    Arguments:
        hardware_api: Hardware control API to pass down to dependencies.
        config: ProtocolEngine configuration.
        error_recovery_policy: The error recovery policy to create the engine with.
            See documentation on `ErrorRecoveryPolicy`.
        load_fixed_trash: Automatically load fixed trash labware in engine.
        deck_configuration: The initial deck configuration the engine will be instantiated with.
        notify_publishers: Notifies robot server publishers of internal state change.
    """
    deck_data = DeckDataProvider(config.deck_type)
    deck_definition = await deck_data.get_deck_definition()
    deck_fixed_labware = (
        await deck_data.get_deck_fixed_labware(deck_definition)
        if load_fixed_trash
        else []
    )
    module_calibration_offsets = ModuleDataProvider.load_module_calibrations()
    robot_definition = load_robot(config.robot_type)
    state_store = StateStore(
        config=config,
        deck_definition=deck_definition,
        deck_fixed_labware=deck_fixed_labware,
        robot_definition=robot_definition,
        is_door_open=hardware_api.door_state is DoorState.OPEN,
        error_recovery_policy=error_recovery_policy,
        module_calibration_offsets=module_calibration_offsets,
        deck_configuration=deck_configuration,
        notify_publishers=notify_publishers,
    )

    return ProtocolEngine(
        state_store=state_store,
        hardware_api=hardware_api,
    )


@contextlib.contextmanager
def create_protocol_engine_in_thread(
    hardware_api: HardwareControlAPI,
    config: Config,
    deck_configuration: typing.Optional[DeckConfigurationType],
    error_recovery_policy: ErrorRecoveryPolicy,
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
            deck_configuration,
            error_recovery_policy,
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
    deck_configuration: typing.Optional[DeckConfigurationType],
    error_recovery_policy: ErrorRecoveryPolicy,
    drop_tips_after_run: bool,
    post_run_hardware_state: PostRunHardwareState,
    load_fixed_trash: bool = False,
) -> typing.AsyncGenerator[ProtocolEngine, None]:
    protocol_engine = await create_protocol_engine(
        hardware_api=hardware_api,
        config=config,
        error_recovery_policy=error_recovery_policy,
        load_fixed_trash=load_fixed_trash,
    )

    # TODO(tz, 6-20-2024): This feels like a hack, we should probably return the orchestrator instead of pe.
    orchestrator = create_run_orchestrator(
        hardware_api=hardware_api,
        protocol_engine=protocol_engine,
    )
    try:
        orchestrator.play(deck_configuration)
        yield protocol_engine
    finally:
        await orchestrator.finish(
            drop_tips_after_run=drop_tips_after_run,
            post_run_hardware_state=post_run_hardware_state,
        )
