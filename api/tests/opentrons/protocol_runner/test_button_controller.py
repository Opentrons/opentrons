"""Tests for the ButtonController interface."""
import asyncio
import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI, ButtonEvent
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_runner import ProtocolRunner
from opentrons.protocol_runner.button_controller import ButtonController


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mocked out ProtocolEngine."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def protocol_runner(decoy: Decoy) -> ProtocolEngine:
    """Get a mocked out ProtocolEngine."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def subject(hardware_api: HardwareAPI) -> ButtonController:
    """Get a ButtonController test subject with its dependencies mocked out."""
    return ButtonController(hardware_api=hardware_api)


async def test_stops_when_protocol_complete(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    protocol_runner: ProtocolRunner,
    subject: ButtonController,
) -> None:
    """It should resolve if the protocol has been stopped."""
    decoy.when(protocol_engine.state_view.commands.get_stop_requested()).then_return(
        True
    )

    await subject.control(
        protocol_engine=protocol_engine,
        protocol_runner=protocol_runner,
    )


async def test_handles_press_event(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    protocol_runner: ProtocolRunner,
    hardware_api: HardwareAPI,
    subject: ButtonController,
) -> None:
    """It should get a button press event and play/pause the runner."""
    decoy.when(protocol_engine.state_view.commands.get_stop_requested()).then_return(
        False,
        False,
        False,
        False,
        True,
    )

    decoy.when(protocol_engine.state_view.commands.get_is_running()).then_return(
        False,
        True,
    )

    decoy.when(await hardware_api.button_watcher.watch()).then_return(
        ButtonEvent.PRESS,
        ButtonEvent.PRESS,
    )

    await subject.control(
        protocol_engine=protocol_engine,
        protocol_runner=protocol_runner,
    )

    decoy.verify(
        protocol_runner.play(),
        protocol_runner.pause(),
    )


async def test_handles_hold_event(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    protocol_runner: ProtocolRunner,
    hardware_api: HardwareAPI,
    subject: ButtonController,
) -> None:
    """It should get a button hold event and stop the runner."""
    decoy.when(protocol_engine.state_view.commands.get_stop_requested()).then_return(
        False,
        False,
        True,
    )

    decoy.when(await hardware_api.button_watcher.watch()).then_return(ButtonEvent.HOLD)

    await subject.control(
        protocol_engine=protocol_engine,
        protocol_runner=protocol_runner,
    )

    decoy.verify(await protocol_runner.stop())


async def test_ignores_event_if_becomes_stopped(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    protocol_runner: ProtocolRunner,
    hardware_api: HardwareAPI,
    subject: ButtonController,
) -> None:
    """It should get a button hold event and stop the runner."""
    decoy.when(protocol_engine.state_view.commands.get_is_running()).then_return(False)

    decoy.when(protocol_engine.state_view.commands.get_stop_requested()).then_return(
        False,
        True,
    )

    decoy.when(await hardware_api.button_watcher.watch()).then_return(
        ButtonEvent.PRESS, ButtonEvent.HOLD
    )

    await subject.control(
        protocol_engine=protocol_engine,
        protocol_runner=protocol_runner,
    )

    decoy.verify(await protocol_runner.stop(), times=0)
    decoy.verify(protocol_runner.play(), times=0)
    decoy.verify(protocol_runner.pause(), times=0)


async def test_races_event_with_becoming_stopped(
    decoy: Decoy,
    protocol_engine: ProtocolEngine,
    protocol_runner: ProtocolRunner,
    hardware_api: HardwareAPI,
    subject: ButtonController,
) -> None:
    """It should stop waiting for button events when a stop is requested."""
    decoy.when(protocol_engine.state_view.commands.get_is_running()).then_return(False)

    decoy.when(protocol_engine.state_view.commands.get_stop_requested()).then_return(
        False
    )

    decoy.when(
        await protocol_engine.wait_for(
            protocol_engine.state_view.commands.get_stop_requested,
        )
    ).then_return(True)

    hardware_api.button_watcher.watch = lambda: asyncio.sleep(100)  # type: ignore[assignment, return-value]  # noqa: E501

    with pytest.raises(asyncio.CancelledError):
        await subject.control(
            protocol_engine=protocol_engine,
            protocol_runner=protocol_runner,
        )
