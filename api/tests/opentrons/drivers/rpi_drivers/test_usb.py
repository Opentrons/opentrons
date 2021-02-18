import pytest

from mock import patch, MagicMock
<<<<<<< HEAD
from opentrons.hardware_control.modules.types import ModuleAtPort
=======
>>>>>>> feat(api): add physical USB Port information to the hardware controller
from opentrons.drivers.rpi_drivers.usb import USBBus
from opentrons.drivers.rpi_drivers.types import USBPort

fake_bus = [
    '/sys/bus/usb/devices/usb1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.0/tty/ttyAMA0/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4/1-1.4.1/1-1.4.1:1.0/tty/ttyAMA1/dev',
<<<<<<< HEAD
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4/1-1.4.3/1-1.4.3:1.0/tty/ttyACM2/dev',
=======
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4/1-1.4.3/1-1.4.3:1.0/tty/ttyACM1/dev',
>>>>>>> feat(api): add physical USB Port information to the hardware controller
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.1/dev',
    '/sys/bus/usb/devices/usb1/1-1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4:1.2/0003:046D:C52B.0017/hidraw/hidraw0/dev',  # NOQA
    '/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4:1.2/usbmisc/hiddev0/dev'
]

filtered_ports = [
    '1-1.3/1-1.3:1.0/tty/ttyACM1/dev',
    '1-1.5/1-1.5:1.0/tty/ttyAMA0/dev',
    '1-1.4/1-1.4/1-1.4.1/1-1.4.1:1.0/tty/ttyAMA1/dev',
<<<<<<< HEAD
    '1-1.4/1-1.4/1-1.4.3/1-1.4.3:1.0/tty/ttyACM2/dev'
=======
    '1-1.4/1-1.4/1-1.4.3/1-1.4.3:1.0/tty/ttyACM1/dev'
>>>>>>> feat(api): add physical USB Port information to the hardware controller
]


@pytest.fixture
def usb_class() -> USBBus:

    @staticmethod
    def fake_read_bus():
        return fake_bus

    with patch.object(USBBus, 'read_bus', fake_read_bus):
        yield USBBus()


def test_usb_list_output(usb_class: USBBus) -> None:
    expected_ports = [USBPort.build(p) for p in filtered_ports]
    assert usb_class.usb_dev == expected_ports
    regular_port = expected_ports[0]
    hub_port = expected_ports[2]

    assert regular_port.name == '1-1.3'
    assert regular_port.hub is None
    assert regular_port.sub_names == []
    assert hub_port.name == '1-1.4.1'
    assert hub_port.hub == 4
    assert hub_port.sub_names == []


def test_find_device(usb_class: USBBus) -> None:
    device_paths = [
        '/tty/ttyACM1/dev',
        '/tty/ttyAMA1/dev',
        '/tty/ttyAMA0/dev']
    for dp in device_paths:
        port = usb_class.find_port(dp)
        assert port in usb_class.usb_dev


def test_unplug_device(usb_class: USBBus) -> None:
    import copy

    copy_bus = copy.copy(fake_bus)
    copy_ports = copy.copy(filtered_ports)
    u = '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev'
    copy_bus.remove(u)
    copy_ports.remove('1-1.3/1-1.3:1.0/tty/ttyACM1/dev')

    usb_class.read_bus = MagicMock(return_value=copy_bus)
    usb_class.sort_ports()

    expected_ports = [USBPort.build(p) for p in copy_ports]
    assert usb_class.usb_dev == expected_ports


def test_sorted_usb_class(usb_class: USBBus) -> None:
    expected_sorted = {'1-1.3', '1-1.4.1', '1-1.4.3', '1-1.5'}
    assert usb_class.sorted_ports == expected_sorted


def test_modify_module_list(usb_class: USBBus):
    usb_class.read_symlink = MagicMock(return_value='ttyACM1')
    mod_at_port_list = [ModuleAtPort(
        name='temperature module',
        port='dev/ot_module_temperature_module')]
    updated_list = usb_class.match_virtual_ports(mod_at_port_list)
    assert updated_list[0].usb_port == usb_class.usb_dev[0]

    usb_class.read_symlink = MagicMock(return_value='ttyACM2')
    mod_at_port_list = [ModuleAtPort(
        name='magnetic module',
        port='dev/ot_module_magnetic_module')]
    updated_list = usb_class.match_virtual_ports(mod_at_port_list)
    assert updated_list[0].usb_port == usb_class.usb_dev[3]
