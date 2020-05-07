from opentrons import hardware_control as hc
from opentrons.hardware_control.types import DoorState
from opentrons.drivers.rpi_drivers.types import gpio_list


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

    # high -> door is open
    hw_api._backend.gpio_chardev.set_low(gpio_list.window_door_sw)
    await hw_api._backend.gpio_chardev.monitor_door_switch_state(
        hw_api.loop, hw_api._update_door_state)
    assert hw_api.door_state == DoorState.OPEN

    # low -> door is closed
    hw_api._backend.gpio_chardev.set_high(gpio_list.window_door_sw)
    await hw_api._backend.gpio_chardev.monitor_door_switch_state(
        hw_api.loop, hw_api._update_door_state)
    assert hw_api.door_state == DoorState.CLOSED
