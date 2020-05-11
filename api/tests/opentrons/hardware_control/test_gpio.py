import asyncio
from opentrons import hardware_control as hc
from opentrons.hardware_control.types import DoorState
from opentrons.drivers.rpi_drivers.types import gpio_group, GpioQueueEvent


async def test_gpio_setup(loop):
    # Test without DTOVERLAY path
    # Board revision should be defaulted to 2.1
    backend = hc.Controller(config=None)
    await backend.setup_gpio_chardev()
    assert str(backend.board_revision) == '2.1'


async def test_gpio_door_state(loop):
    # API.door_state would change based on the value read from
    # the window_door_sw pin
    hw_api = await hc.API.build_hardware_simulator(
        loop=loop)
    task = loop.create_task(
        hw_api._backend.gpio_chardev.monitor_door_switch_state(
            loop=loop,
            update_door_state=hw_api._update_door_state))
    await asyncio.sleep(0.1)
    gpio_chardev = hw_api._backend.gpio_chardev

    # high -> door is open
    gpio_chardev.set_low(gpio_group.window_door_sw)
    gpio_chardev.event_queue.put_nowait(
        GpioQueueEvent.EVENT_RECEIVED)
    await asyncio.sleep(0.1)
    assert hw_api.door_state == DoorState.OPEN

    # low -> door is closed
    gpio_chardev.set_high(gpio_group.window_door_sw)
    gpio_chardev.event_queue.put_nowait(
        GpioQueueEvent.EVENT_RECEIVED)
    await asyncio.sleep(0.1)
    assert hw_api.door_state == DoorState.CLOSED

    task.cancel()
