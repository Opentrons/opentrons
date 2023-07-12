"""Tests for opentrons.hardware_control.module_control."""
import pytest
from decoy import Decoy, matchers
from typing import Awaitable, Callable, cast

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.rpi_drivers.interfaces import USBDriverInterface
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import ModuleAtPort, ModuleType
from opentrons.hardware_control.module_control import AttachedModulesControl


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture()
def usb_bus(decoy: Decoy) -> USBDriverInterface:
    """Get a mocked out USBBus."""
    return decoy.mock(cls=USBDriverInterface)


@pytest.fixture()
def build_module(decoy: Decoy) -> Callable[..., Awaitable[AbstractModule]]:
    """Get a mocked out AttachedModuleControl.build_module.

    !!! warning

        This is bad testing practice and code smell. The fact that I can't
        test this module without faking out a part of it means that the
        `AttachedModulesControl` is doing too much work _and_ these tests
        are too brittle and of questionable value.
    """
    return cast(Callable[..., Awaitable[AbstractModule]], decoy.mock(is_async=True))


@pytest.fixture()
def subject(
    hardware_api: HardwareAPI,
    usb_bus: USBDriverInterface,
    build_module: Callable[..., Awaitable[AbstractModule]],
) -> AttachedModulesControl:
    modules_control = AttachedModulesControl(api=hardware_api, usb=usb_bus)

    # TODO(mc, 2022-03-01): partial patching the class under test creates
    # a contaminated test subject that reduces the value of these tests
    # https://github.com/testdouble/contributing-tests/wiki/Partial-Mock
    modules_control.build_module = build_module  # type: ignore[assignment]
    return modules_control


async def test_register_modules(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_module: Callable[..., Awaitable[AbstractModule]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """It should register attached modules."""
    new_mods_at_ports = [ModuleAtPort(port="/dev/foo", name="bar")]
    actual_ports = [
        ModuleAtPort(
            port="/dev/foo",
            name="tempdeck",
            usb_port=USBPort(name="baz", port_number=0),
        )
    ]

    module = decoy.mock(cls=AbstractModule)
    decoy.when(module.usb_port).then_return(USBPort(name="baz", port_number=0))

    decoy.when(usb_bus.match_virtual_ports(new_mods_at_ports)).then_return(actual_ports)
    decoy.when(
        await build_module(
            port="/dev/foo",
            usb_port=USBPort(name="baz", port_number=0),
            type=ModuleType.TEMPERATURE,
        )
    ).then_return(module)

    await subject.register_modules(new_mods_at_ports=new_mods_at_ports)
    result = subject.available_modules

    assert result == [module]


async def test_register_modules_sort(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_module: Callable[..., Awaitable[AbstractModule]],
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

    new_mods_at_ports = [ModuleAtPort(port="/dev/foo", name="bar")]
    actual_ports = [
        ModuleAtPort(port="/dev/a", name="magdeck", usb_port=module_1.usb_port),
        ModuleAtPort(port="/dev/b", name="tempdeck", usb_port=module_2.usb_port),
        ModuleAtPort(port="/dev/c", name="thermocycler", usb_port=module_3.usb_port),
        ModuleAtPort(port="/dev/d", name="heatershaker", usb_port=module_4.usb_port),
    ]

    decoy.when(usb_bus.match_virtual_ports(new_mods_at_ports)).then_return(actual_ports)

    for mod in [module_1, module_2, module_3, module_4]:
        decoy.when(
            await build_module(
                usb_port=mod.usb_port,
                port=matchers.Anything(),
                type=matchers.Anything(),
            )
        ).then_return(mod)

    await subject.register_modules(new_mods_at_ports=new_mods_at_ports)
    result = subject.available_modules

    assert result == [module_4, module_3, module_2, module_1]
