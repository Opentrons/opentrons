import pytest
from mock import patch, MagicMock
from typing import Iterator, cast

from opentrons.hardware_control.modules.types import ModuleAtPort
from opentrons.hardware_control.types import BoardRevision
from opentrons.drivers.rpi_drivers.usb import USBBus
from opentrons.drivers.rpi_drivers.types import USBPort, PortGroup

fake_bus_og = [
    "/sys/bus/usb/devices/usb1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.0/tty/ttyAMA0/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5/1-1.5.1/1-1.5.1:1.0/tty/ttyAMA1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5/1-1.5.3/1-1.5.3:1.0/tty/ttyACM2/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/0003:046D:C52B.0017/hidraw/hidraw0/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/usbmisc/hiddev0/dev",
]

fake_bus_refresh = [
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/1-1.3.1:1.0/tty/ttyACM1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/1-1.3.2.3/1-1.3.2.3:1.0/tty/ttyACM2/dev"
    "/sys/bus/usb/devices/usb1/1-1/1-1.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/dev",
]

fake_bus_flex = [
    "/sys/bus/usb/devices/usb1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.4/1-1.3.4:1.0/tty/ttyACM1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.4/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.1/1-1.1:1.0/tty/ttyACM0/dev",
    "/sys/bus/usb/devices/usb1/1-1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.6/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.6/1-1.6:1.0/media0/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.6/1-1.6:1.0/video4linux/video1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.6/1-1.6:1.0/video4linux/video0/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.6/1-1.6:1.0/input/input3/event3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4.2/1-1.4.2.4/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4.2/1-1.4.2.4/1-1.4.2.4:1.0/tty/ttyACM3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4.2/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4.2/1-1.4.2.3/1-1.4.2.3:1.0/tty/ttyACM2/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/1-1.4.2/1-1.4.2.3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.4/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.7/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.7/1-1.7:1.0/tty/ttyACM4/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.7/1-1.7.4/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.7/1-1.7.4/1-1.7.4:1.0/tty/ttyACM5/dev",
]


@pytest.fixture(params=[BoardRevision.OG, BoardRevision.A, BoardRevision.FLEX_B2])
def revision(request) -> BoardRevision:
    return cast(BoardRevision, request.param)


@pytest.fixture()
def usb_bus(revision: BoardRevision) -> Iterator[USBBus]:
    @staticmethod  # type: ignore[misc]
    def fake_read_bus():
        if revision == BoardRevision.OG:
            return fake_bus_og
        elif revision == BoardRevision.A:
            return fake_bus_refresh
        else:
            return fake_bus_flex

    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    with patch.object(USBBus, "_read_bus", fake_read_bus):
        yield USBBus(revision)


def test_modify_module_list(revision: BoardRevision, usb_bus: USBBus):
    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    usb_bus._read_symlink = MagicMock(return_value="ttyACM1")  # type: ignore[assignment]
    mod_at_port_list = [
        ModuleAtPort(
            name="temperature module", port="dev/ot_module_temperature_module"
        ),
    ]
    updated_list = usb_bus.match_virtual_ports(mod_at_port_list)

    if revision == BoardRevision.OG:
        expected_name = "1-1.3"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=1,
            port_group=PortGroup.MAIN,
            device_path="1.0/tty/ttyACM1/dev",
            hub=False,
            hub_port=None,
        )
    elif revision == BoardRevision.A:
        expected_name = "1-1.3.1"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=1,
            port_group=PortGroup.MAIN,
            device_path="1.0/tty/ttyACM1/dev",
            hub=False,
            hub_port=None,
        )
    elif revision == BoardRevision.FLEX_B2:
        expected_name = "1-1.3.4"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=5,
            port_group=PortGroup.RIGHT,
            device_path="1.0/tty/ttyACM1/dev",
            hub=False,
            hub_port=None,
        )

    usb_bus._read_symlink = MagicMock(return_value="ttyACM2")  # type: ignore[assignment]
    mod_at_port_list = [
        ModuleAtPort(name="magnetic module", port="dev/ot_module_magnetic_module"),
    ]
    updated_list = usb_bus.match_virtual_ports(mod_at_port_list)

    if revision == BoardRevision.OG:
        expected_name = "1-1.5.3"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=2,
            port_group=PortGroup.MAIN,
            device_path="1.0/tty/ttyACM2/dev",
            hub=True,
            hub_port=3,
        )
    elif revision == BoardRevision.A:
        expected_name = "1-1.3.2.3"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=2,
            port_group=PortGroup.MAIN,
            device_path="1.0/tty/ttyACM2/dev",
            hub=True,
            hub_port=3,
        )
    elif revision == BoardRevision.FLEX_B2:
        expected_name = "1-1.4.2.3"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=3,
            port_group=PortGroup.LEFT,
            device_path="1.0/tty/ttyACM2/dev",
            hub=True,
            hub_port=3,
        )

    if revision == BoardRevision.FLEX_B2:
        usb_bus._read_symlink = MagicMock(return_value="ttyACM4")  # type: ignore[assignment]
        mod_at_port_list = [
            ModuleAtPort(
                name="heater-shaker module", port="dev/ot_module_heater_shaker_module"
            ),
        ]
        updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
        expected_name = "1-1.7"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=9,
            port_group=PortGroup.FRONT,
            device_path="1.0/tty/ttyACM4/dev",
            hub=False,
            hub_port=None,
        )

        usb_bus._read_symlink = MagicMock(return_value="ttyACM5")  # type: ignore[assignment]
        mod_at_port_list = [
            ModuleAtPort(
                name="thermocycler module", port="dev/ot_module_thermocycler_module"
            ),
        ]
        updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
        expected_name = "1-1.7.4"
        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=9,
            port_group=PortGroup.FRONT,
            device_path="1.0/tty/ttyACM5/dev",
            hub=True,
            hub_port=4,
        )
