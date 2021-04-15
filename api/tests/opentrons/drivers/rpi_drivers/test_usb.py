import pytest

from mock import patch, MagicMock
from opentrons.hardware_control.modules.types import ModuleAtPort
from opentrons.hardware_control.types import BoardRevision
from opentrons.drivers.rpi_drivers.usb import USBBus
from opentrons.drivers.rpi_drivers.types import USBPort

fake_bus_og = [
    '/sys/bus/usb/devices/usb1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.0/tty/ttyAMA0/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5/1-1.5.1/1-1.5.1:1.0/tty/ttyAMA1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5/1-1.5.3/1-1.5.3:1.0/tty/ttyACM2/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.1/dev',
    '/sys/bus/usb/devices/usb1/1-1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/0003:046D:C52B.0017/hidraw/hidraw0/dev',  # noqa: E501
    '/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/usbmisc/hiddev0/dev'
]

filtered_ports_og = [
    '1-1.3/1-1.3:1.0/tty/ttyACM1/dev',
    '1-1.5/1-1.5:1.0/tty/ttyAMA0/dev',
    '1-1.5/1-1.5/1-1.5.1/1-1.5.1:1.0/tty/ttyAMA1/dev',
    '1-1.5/1-1.5/1-1.5.3/1-1.5.3:1.0/tty/ttyACM2/dev'
]

fake_bus_refresh = [
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/1-1.3.1:1.0/tty/ttyACM1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/1-1.3.2:1.0/tty/ttyACM0/dev',
    '/sys/bus/usb/devices/usb1/1-1/1-1.1/dev',
    '/sys/bus/usb/devices/usb1/1-1/dev'
]

filtered_port_refresh = [
    '1-1.3/1-1.3.1/1-1.3.1:1.0/tty/ttyACM1/dev',
    '1-1.3/1-1.3.2/1-1.3.2:1.0/tty/ttyACM0/dev'
]


@pytest.fixture
def usb_bus() -> USBBus:

    @staticmethod
    def fake_read_bus():
        return fake_bus_og

    with patch.object(USBBus, 'read_bus', fake_read_bus):
        yield USBBus(BoardRevision.OG)


@pytest.fixture(params=[BoardRevision.OG, BoardRevision.A])
def usb_revision(request) -> USBBus:
    revision = request.param

    @staticmethod
    def fake_read_bus():
        if revision == BoardRevision.OG:
            return fake_bus_og
        else:
            return fake_bus_refresh

    with patch.object(USBBus, 'read_bus', fake_read_bus):
        yield USBBus(revision)


def test_usb_list_output(usb_revision) -> None:
    if usb_revision._board_revision == BoardRevision.OG:
        filtered = filtered_ports_og
    else:
        filtered = filtered_port_refresh
    expected_ports = [
        USBPort.build(p, usb_revision._board_revision)
        for p in filtered]
    assert usb_revision.usb_dev == expected_ports
    regular_port = expected_ports[0]

    if usb_revision._board_revision == BoardRevision.OG:
        assert regular_port.name == '1-1.3'
        assert regular_port.hub is None
        assert regular_port.port_number == 1
        assert regular_port.sub_names == []

        hub_port = expected_ports[2]
        assert hub_port.name == '1-1.5.1'
        assert hub_port.hub == 2
        assert hub_port.port_number == 1
        assert hub_port.sub_names == []
    else:
        regular_port2 = expected_ports[1]
        assert regular_port.name == '1-1.3.1'
        assert regular_port.hub is None
        assert regular_port.port_number == 1

        assert regular_port2.name == '1-1.3.2'
        assert regular_port2.hub is None
        assert regular_port2.port_number == 2


def test_find_device(usb_bus: USBBus) -> None:
    device_paths = [
        '/tty/ttyACM1/dev',
        '/tty/ttyAMA1/dev',
        '/tty/ttyAMA0/dev']
    for dp in device_paths:
        port = usb_bus.find_port(dp)
        assert port in usb_bus.usb_dev


def test_unplug_device(usb_bus: USBBus) -> None:
    import copy

    copy_bus = copy.copy(fake_bus_og)
    copy_ports = copy.copy(filtered_ports_og)
    u = '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev'
    copy_bus.remove(u)
    copy_ports.remove('1-1.3/1-1.3:1.0/tty/ttyACM1/dev')

    usb_bus.read_bus = MagicMock(return_value=copy_bus)
    usb_bus.sort_ports()

    expected_ports = [
        USBPort.build(p, usb_bus._board_revision)
        for p in copy_ports]
    assert usb_bus.usb_dev == expected_ports


def test_sorted_usb_bus(usb_bus: USBBus) -> None:
    expected_sorted = {'1-1.3', '1-1.5.1', '1-1.5.3', '1-1.5'}
    assert usb_bus.sorted_ports == expected_sorted


def test_modify_module_list(usb_bus: USBBus):
    usb_bus.read_symlink = MagicMock(return_value='ttyACM1')
    mod_at_port_list = [ModuleAtPort(
        name='temperature module',
        port='dev/ot_module_temperature_module')]
    updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
    assert updated_list[0].usb_port == usb_bus.usb_dev[0]

    usb_bus.read_symlink = MagicMock(return_value='ttyACM2')
    mod_at_port_list = [ModuleAtPort(
        name='magnetic module',
        port='dev/ot_module_magnetic_module')]
    updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
    assert updated_list[0].usb_port == usb_bus.usb_dev[3]
