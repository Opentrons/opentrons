import pytest
from mock import patch, MagicMock
from typing import Iterator, cast

from opentrons.hardware_control.modules.types import ModuleAtPort
from opentrons.hardware_control.types import BoardRevision
from opentrons.drivers.rpi_drivers.usb import USBBus
from opentrons.drivers.rpi_drivers.types import USBPort

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
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/0003:046D:C52B.0017/hidraw/hidraw0/dev",  # noqa: E501
    "/sys/bus/usb/devices/usb1/1-1/1-1.5/1-1.5:1.2/usbmisc/hiddev0/dev",
]

fake_bus_refresh = [
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/1-1.3.1:1.0/tty/ttyACM1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3.2/1-1.3.2:1.0/tty/ttyACM0/dev",
    "/sys/bus/usb/devices/usb1/1-1/1-1.1/dev",
    "/sys/bus/usb/devices/usb1/1-1/dev",
]


@pytest.fixture(params=[BoardRevision.OG, BoardRevision.A])
def revision(request) -> BoardRevision:
    return cast(BoardRevision, request.param)


@pytest.fixture()
def usb_bus(revision: BoardRevision) -> Iterator[USBBus]:
    @staticmethod  # type: ignore[misc]
    def fake_read_bus():
        if revision == BoardRevision.OG:
            return fake_bus_og
        else:
            return fake_bus_refresh

    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    with patch.object(USBBus, "_read_bus", fake_read_bus):
        yield USBBus(revision)


def test_modify_module_list(revision: BoardRevision, usb_bus: USBBus):
    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    usb_bus._read_symlink = MagicMock(return_value="ttyACM1")  # type: ignore[assignment]  # noqa: E501
    mod_at_port_list = [
        ModuleAtPort(name="temperature module", port="dev/ot_module_temperature_module")
    ]
    updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
    expected_name = "1-1.3" if revision == BoardRevision.OG else "1-1.3.1"

    assert updated_list[0].usb_port == USBPort(
        name=expected_name,
        port_number=1,
        device_path="1.0/tty/ttyACM1/dev",
    )

    # TODO(mc, 2022-03-01): figure out why this section of the test doesn't
    # work on using the OT-2R mocked port values
    if revision == BoardRevision.OG:
        usb_bus._read_symlink = MagicMock(return_value="ttyACM2")  # type: ignore[assignment]  # noqa: E501
        mod_at_port_list = [
            ModuleAtPort(name="magnetic module", port="dev/ot_module_magnetic_module")
        ]
        updated_list = usb_bus.match_virtual_ports(mod_at_port_list)
        expected_name = "1-1.5.3"

        assert updated_list[0].usb_port == USBPort(
            name=expected_name,
            port_number=3,
            hub=2,
            device_path="1.0/tty/ttyACM2/dev",
        )
