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


def _make_module(
    decoy: Decoy,
    *,
    serial: str = "serial-1",
    port: str = "/dev/ot_module_tempdeck0",
    usb_port: USBPort = USBPort(name="a", port_number=1),
) -> AbstractModule:
    """Build a decoy AbstractModule."""
    module = decoy.mock(cls=AbstractModule)
    decoy.when(module.serial_number).then_return(serial)
    decoy.when(module.usb_port).then_return(usb_port)
    decoy.when(module.port).then_return(port)
    return module


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


async def test_dedupe_available_modules_replaces_stale_entry(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_dedupe_available_modules should replace an existing entry with the same serial."""
    decoy.when(hardware_api.is_simulator).then_return(False)
    stale = _make_module(decoy, serial="ABC", port="/dev/ot_module_tempdeck0")
    fresh = _make_module(decoy, serial="ABC", port="/dev/ot_module_tempdeck0")

    subject._available_modules.append(stale)

    subject._dedupe_available_modules(fresh)

    assert subject._available_modules == [fresh]


async def test_dedupe_available_modules_keeps_other_serials(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_dedupe_available_modules should only remove entries sharing the serial."""
    decoy.when(hardware_api.is_simulator).then_return(False)
    other = _make_module(
        decoy,
        serial="OTHER",
        port="/dev/ot_module_tempdeck1",
        usb_port=USBPort(name="b", port_number=2),
    )
    stale_same = _make_module(decoy, serial="ABC", port="/dev/ot_module_tempdeck0")
    fresh_same = _make_module(
        decoy,
        serial="ABC",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="c", port_number=3),
    )

    subject._available_modules = [other, stale_same]

    subject._dedupe_available_modules(fresh_same)

    assert subject._available_modules == [other, fresh_same]


async def test_dedupe_available_modules_appends_when_no_existing(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_dedupe_available_modules should append when no matching serial exists."""
    decoy.when(hardware_api.is_simulator).then_return(False)
    mod = _make_module(decoy, serial="NEW")

    subject._dedupe_available_modules(mod)

    assert subject._available_modules == [mod]


async def test_dedupe_available_modules_evicts_parked_entry_same_serial(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """A fresh attach should not duplicate a parked entry in available_modules
    once reconnect completes.
    """
    decoy.when(hardware_api.is_simulator).then_return(False)
    parked = _make_module(decoy, serial="DUP", port="/dev/ot_module_tempdeck0")
    fresh = _make_module(decoy, serial="DUP", port="/dev/ot_module_tempdeck0")

    subject._recently_removed_modules = [parked]
    subject._available_modules = []

    subject._dedupe_available_modules(fresh)

    assert subject._available_modules == [fresh]
    assert subject._recently_removed_modules == [parked]
    assert subject.available_modules == [fresh, parked]

    decoy.when(await fresh.soft_cleanup())
    decoy.when(await parked.soft_cleanup())
    decoy.when(await parked.attempt_reconnect())

    await subject._reconnect_patch()

    assert subject._available_modules == [parked]
    assert subject._recently_removed_modules == []
    assert subject.available_modules == [parked]


async def test_register_devices_dedupes_on_attach(
    decoy: Decoy,
    usb_bus: USBDriverInterface,
    build_device: Callable[..., Awaitable[AbstractDevice]],
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """register_devices should not create a duplicate when a stale entry exists."""
    decoy.when(hardware_api.is_simulator).then_return(False)
    stale = _make_module(decoy, serial="DUP", port="/dev/foo")
    fresh = _make_module(
        decoy,
        serial="DUP",
        port="/dev/foo",
        usb_port=USBPort(name="baz", port_number=0),
    )

    subject._available_modules.append(stale)

    mods_at_port = [ModuleAtPort(port="/dev/foo", name="tempdeck")]
    decoy.when(usb_bus.match_virtual_ports(mods_at_port)).then_return(
        [
            ModuleAtPort(
                port="/dev/foo",
                name="tempdeck",
                usb_port=USBPort(name="baz", port_number=0),
            )
        ]
    )
    decoy.when(
        await build_device(
            port="/dev/foo",
            usb_port=USBPort(name="baz", port_number=0),
            type=matchers.Anything(),
            sim_serial_number=None,
            sim_model=None,
        )
    ).then_return(fresh)

    await subject.register_devices(new_devices_at_ports=mods_at_port)

    assert subject.available_modules == [fresh]


async def test_reconnect_patch_breaks_after_first_match(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_reconnect_patch should process a reconnected module exactly once."""
    old_mod = _make_module(
        decoy,
        serial="XYZ",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )
    attached_mod = _make_module(
        decoy,
        serial="XYZ",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )

    subject._recently_removed_modules = [old_mod]
    subject._available_modules = [attached_mod]

    decoy.when(hardware_api.is_simulator).then_return(False)
    decoy.when(await attached_mod.soft_cleanup())
    decoy.when(await old_mod.soft_cleanup())
    decoy.when(await old_mod.attempt_reconnect())

    await subject._reconnect_patch()

    assert subject._available_modules == [old_mod]
    assert subject._recently_removed_modules == []


async def test_reconnect_patch_dedupes_when_fresh_already_present(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_reconnect_patch should not leave two entries for one serial."""
    old_mod = _make_module(
        decoy,
        serial="RACE",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )
    fresh = _make_module(
        decoy,
        serial="RACE",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )

    subject._recently_removed_modules = [old_mod]
    # fresh already registered by the concurrent CREATE path
    subject._available_modules = [fresh]

    decoy.when(hardware_api.is_simulator).then_return(False)
    decoy.when(await fresh.soft_cleanup())
    decoy.when(await old_mod.soft_cleanup())
    decoy.when(await old_mod.attempt_reconnect())

    await subject._reconnect_patch()

    assert subject._available_modules == [old_mod]
    assert len(subject._available_modules) == 1


async def test_clear_old_modules_guarded_remove(
    decoy: Decoy,
    subject: AttachedModulesControl,
) -> None:
    """_clear_old_modules should not raise if the entry was already removed."""
    old_mod = _make_module(decoy, serial="GONE")
    subject._recently_removed_modules = [old_mod]

    decoy.when(old_mod.disconnected_callback())
    decoy.when(await old_mod.cleanup())

    # First call removes it normally.
    await subject._clear_old_modules()
    assert subject._recently_removed_modules == []

    # Second call must not raise ValueError on the now-empty list.
    await subject._clear_old_modules()
    assert subject._recently_removed_modules == []


async def test_reconnect_patch_guarded_remove(
    decoy: Decoy,
    hardware_api: HardwareAPI,
    subject: AttachedModulesControl,
) -> None:
    """_reconnect_patch should not raise if old_mod was concurrently removed."""
    old_mod = _make_module(
        decoy,
        serial="CONCURRENT",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )
    attached_mod = _make_module(
        decoy,
        serial="CONCURRENT",
        port="/dev/ot_module_tempdeck0",
        usb_port=USBPort(name="a", port_number=1),
    )

    subject._recently_removed_modules = [old_mod]
    subject._available_modules = [attached_mod]

    decoy.when(hardware_api.is_simulator).then_return(False)
    decoy.when(await attached_mod.soft_cleanup())
    decoy.when(await old_mod.soft_cleanup())

    async def _clear_concurrently() -> None:
        subject._recently_removed_modules.clear()

    decoy.when(await old_mod.attempt_reconnect()).then_do(  # type: ignore[func-returns-value]
        _clear_concurrently
    )

    # Must not raise ValueError.
    await subject._reconnect_patch()

    assert subject._available_modules == [old_mod]
