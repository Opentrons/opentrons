"""Tests for opentrons.hardware_control.module_control."""

import asyncio
from typing import Awaitable, Callable, List, Union, cast

import pytest
from decoy import Decoy, matchers

from opentrons.drivers.rpi_drivers.interfaces import USBDriverInterface
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control import types
from opentrons.hardware_control.abstract_device import AbstractDevice
from opentrons.hardware_control.module_control import (
    AttachedModulesControl,
)
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import (
    ModuleAtPort,
    ModuleType,
    SimulatingModuleAtPort,
)
from opentrons.hardware_control.peripherals import AbstractPeripheral
from opentrons.hardware_control.peripherals.types import PeripheralType


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture()
def usb_bus(decoy: Decoy) -> USBDriverInterface:
    """Get a mocked out USBBus."""
    return decoy.mock(cls=USBDriverInterface)


@pytest.fixture()
def build_device(decoy: Decoy) -> Callable[..., Awaitable[AbstractDevice]]:
    """Get a mocked out AttachedModuleControl.build_device.

    !!! warning

        This is bad testing practice and code smell. The fact that I can't
        test this module without faking out a part of it means that the
        `AttachedModulesControl` is doing too much work _and_ these tests
        are too brittle and of questionable value.
    """
    return cast(
        Callable[..., Awaitable[AbstractDevice]],
        decoy.mock(name="build_device", is_async=True),
    )


@pytest.fixture()
def event_callback(decoy: Decoy) -> Callable[[types.HardwareEvent], None]:
    return decoy.mock(name="event_callback")  # type: ignore[no-any-return]


@pytest.fixture()
def subject(
    hardware_api: HardwareAPI,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    event_callback: Callable[[types.HardwareEvent], None],
) -> AttachedModulesControl:
    modules_control = AttachedModulesControl(
        api=hardware_api, usb=usb_bus, event_callback=event_callback
    )

    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    modules_control.build_device = build_device  # type: ignore[assignment]
    return modules_control


async def test_register_mixed_devices(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """It should register attached modules."""
    actual_ports = [
        ModuleAtPort(
            port="/dev/foo1",
            name="tempdeck",
            usb_port=USBPort(name="baz1", port_number=0),
        ),
        ModuleAtPort(
            port="/dev/foo2",
            name="barcodescanner",
            usb_port=USBPort(name="baz2", port_number=1),
        ),
    ]

    module = decoy.mock(cls=AbstractModule)
    peripheral = decoy.mock(cls=AbstractPeripheral)
    decoy.when(module.usb_port).then_return(USBPort(name="baz1", port_number=0))
    decoy.when(peripheral.usb_port).then_return(USBPort(name="baz2", port_number=1))

    decoy.when(usb_bus.match_virtual_ports(actual_ports)).then_return(actual_ports)
    decoy.when(
        await build_device(
            port="/dev/foo1",
            usb_port=USBPort(name="baz1", port_number=0),
            type=ModuleType.TEMPERATURE,
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(module)
    decoy.when(
        await build_device(
            port="/dev/foo2",
            usb_port=USBPort(name="baz2", port_number=1),
            type=PeripheralType.BARCODE_SCANNER,
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(peripheral)

    await subject.register_devices(new_devices_at_ports=actual_ports)
    modules = subject.available_modules
    peripherals = subject.available_peripherals

    assert modules == [module]
    assert peripherals == [peripheral]


@pytest.mark.parametrize(
    "module_at_port_input",
    [
        ([ModuleAtPort(port="/dev/foo", name="bar")]),
        (
            [
                SimulatingModuleAtPort(
                    port="/dev/foo",
                    name="bar",
                    serial_number="test-123",
                    model="mymodel",
                )
            ]
        ),
    ],
)
async def test_register_modules(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
    module_at_port_input: Union[List[ModuleAtPort], List[SimulatingModuleAtPort]],
) -> None:
    """It should register attached modules."""
    actual_ports = [
        ModuleAtPort(
            port="/dev/foo",
            name="tempdeck",
            usb_port=USBPort(name="baz", port_number=0),
        )
    ]

    module = decoy.mock(cls=AbstractModule)
    decoy.when(module.usb_port).then_return(USBPort(name="baz", port_number=0))

    decoy.when(usb_bus.match_virtual_ports(module_at_port_input)).then_return(
        actual_ports
    )
    decoy.when(
        await build_device(
            port="/dev/foo",
            usb_port=USBPort(name="baz", port_number=0),
            type=ModuleType.TEMPERATURE,
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(module)

    await subject.register_devices(new_devices_at_ports=module_at_port_input)
    result = subject.available_modules

    assert result == [module]


async def test_register_modules_sort(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """It should sort modules by port and hub, in ascending order."""
    module_1 = decoy.mock(cls=AbstractModule)
    decoy.when(module_1.usb_port).then_return(
        USBPort(name="a", port_number=4, hub=True, hub_port=2)
    )

    module_2 = decoy.mock(cls=AbstractModule)
    decoy.when(module_2.usb_port).then_return(
        USBPort(name="b", port_number=4, hub=True, hub_port=1)
    )

    module_3 = decoy.mock(cls=AbstractModule)
    decoy.when(module_3.usb_port).then_return(USBPort(name="c", port_number=3))

    module_4 = decoy.mock(cls=AbstractModule)
    decoy.when(module_4.usb_port).then_return(USBPort(name="x", port_number=2))

    module_5 = decoy.mock(cls=AbstractModule)
    decoy.when(module_5.usb_port).then_return(USBPort(name="z", port_number=1))

    new_mods_at_ports = [ModuleAtPort(port="/dev/foo", name="bar")]
    actual_ports = [
        ModuleAtPort(port="/dev/a", name="magdeck", usb_port=module_1.usb_port),
        ModuleAtPort(port="/dev/b", name="tempdeck", usb_port=module_2.usb_port),
        ModuleAtPort(port="/dev/c", name="thermocycler", usb_port=module_3.usb_port),
        ModuleAtPort(port="/dev/d", name="heatershaker", usb_port=module_4.usb_port),
        ModuleAtPort(
            port="/dev/d", name="absorbancereader", usb_port=module_5.usb_port
        ),
    ]

    decoy.when(usb_bus.match_virtual_ports(new_mods_at_ports)).then_return(actual_ports)

    for mod in [module_1, module_2, module_3, module_4, module_5]:
        decoy.when(
            await build_device(
                usb_port=mod.usb_port,
                port=matchers.Anything(),
                type=matchers.Anything(),
                sim_serial_number=None,
                sim_model=None,
            )
        ).then_return(mod)

    await subject.register_devices(new_devices_at_ports=new_mods_at_ports)
    result = subject.available_modules

    assert result == [module_5, module_4, module_3, module_2, module_1]


async def test_unregister_modules(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """It should register attached modules."""
    loop = decoy.mock(cls=asyncio.AbstractEventLoop)
    decoy.when(hardware_api.loop).then_return(loop)
    # Add a module
    module_1 = decoy.mock(cls=AbstractModule)
    decoy.when(module_1.usb_port).then_return(
        USBPort(name="a", port_number=4, hub=True, hub_port=2)
    )
    decoy.when(module_1.serial_number).then_return("FakeSerial")
    decoy.when(module_1.port).then_return("/dev/foo")

    module_2 = decoy.mock(cls=AbstractModule)
    decoy.when(module_2.usb_port).then_return(
        USBPort(name="a", port_number=4, hub=True, hub_port=2)
    )
    decoy.when(module_2.serial_number).then_return("FakeSerial")
    decoy.when(module_2.port).then_return("/dev/bar")

    decoy.when(hardware_api.is_simulator).then_return(False)
    # setup ports for mod 1
    new_mods_at_ports = [ModuleAtPort(port="/dev/foo", name="bar")]
    actual_ports = [
        ModuleAtPort(port="/dev/foo", name="magdeck", usb_port=module_1.usb_port),
    ]

    decoy.when(usb_bus.match_virtual_ports(new_mods_at_ports)).then_return(actual_ports)

    decoy.when(
        await build_device(
            usb_port=module_1.usb_port,
            port="/dev/foo",
            type=matchers.Anything(),
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(module_1)
    decoy.when(
        await build_device(
            usb_port=module_2.usb_port,
            port="/dev/bar",
            type=matchers.Anything(),
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(module_2)

    await subject.register_devices(new_devices_at_ports=new_mods_at_ports)
    assert subject.available_modules == [module_1]
    await subject.unregister_devices(devices_at_ports=new_mods_at_ports)
    assert subject.available_modules == [module_1]
    assert subject._available_modules == []
    assert subject._recently_removed_modules == [module_1]
    decoy.verify(loop.call_later(matchers.IsA(float), matchers.Anything()), times=1)
    # loop is a mock so we need to call clear modules ourselves.
    await subject._clear_old_modules()
    assert subject._recently_removed_modules == []

    # Test a module gets reconnected when it reappers on a new port
    # connect and disconnect
    await subject.register_devices(new_devices_at_ports=new_mods_at_ports)
    await subject.unregister_devices(devices_at_ports=new_mods_at_ports)
    # device comes back on another port
    new_mods_at_ports = [ModuleAtPort(port="/dev/bar", name="bar")]
    actual_ports = [
        ModuleAtPort(port="/dev/bar", name="magdeck", usb_port=module_2.usb_port),
    ]
    decoy.when(usb_bus.match_virtual_ports(new_mods_at_ports)).then_return(actual_ports)
    await subject.register_devices(new_devices_at_ports=new_mods_at_ports)
    # reconnect gets called and module 1 gets reconnected
    assert subject.available_modules == [module_1]
    assert subject._available_modules == [module_1]
    assert subject._recently_removed_modules == []
    decoy.verify(
        await module_1.move_port(port="/dev/bar", usb_port=module_2.usb_port), times=1
    )
