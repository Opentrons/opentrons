import asyncio
from typing import Dict, Optional, Any, List, Union
from typing_extensions import Literal
from dataclasses import dataclass, asdict, field, replace
import json
from pathlib import Path
from warnings import warn

from opentrons.config import robot_configs
from opentrons.config.types import RobotConfig, OT3Config
from opentrons.types import Mount
from opentrons.hardware_control import API, HardwareControlAPI, ThreadManager
from opentrons.hardware_control.types import OT3Mount, HardwareFeatureFlags
from opentrons.hardware_control.modules import SimulatingModule


# Name and kwargs for a module function
@dataclass(frozen=True)
class ModuleCall:
    function_name: str
    args: List[Any] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ModuleItem:
    serial_number: str
    model: str
    calls: List[ModuleCall] = field(default_factory=list)


@dataclass(frozen=True)
class OT2SimulatorSetup:
    machine: Literal["OT-2 Standard"] = "OT-2 Standard"
    attached_instruments: Dict[Mount, Dict[str, Optional[str]]] = field(
        default_factory=dict
    )
    attached_modules: Dict[str, List[ModuleItem]] = field(default_factory=dict)
    config: Optional[RobotConfig] = None
    strict_attached_instruments: bool = True


@dataclass(frozen=True)
class OT3SimulatorSetup:
    machine: Literal["OT-3 Standard"] = "OT-3 Standard"
    attached_instruments: Dict[OT3Mount, Dict[str, Optional[str]]] = field(
        default_factory=dict
    )
    attached_modules: Dict[str, List[ModuleItem]] = field(default_factory=dict)
    config: Optional[OT3Config] = None
    strict_attached_instruments: bool = True


SimulatorSetup = Union[OT2SimulatorSetup, OT3SimulatorSetup]


async def _simulator_for_setup(
    setup: SimulatorSetup, loop: Optional[asyncio.AbstractEventLoop]
) -> HardwareControlAPI:
    if setup.machine == "OT-2 Standard":
        return await API.build_hardware_simulator(
            attached_instruments=setup.attached_instruments,
            attached_modules={
                k: [
                    SimulatingModule(serial_number=m.serial_number, model=m.model)
                    for m in v
                ]
                for k, v in setup.attached_modules.items()
            },
            config=setup.config,
            strict_attached_instruments=setup.strict_attached_instruments,
            loop=loop,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )
    else:
        from opentrons.hardware_control.ot3api import OT3API

        return await OT3API.build_hardware_simulator(
            attached_instruments=setup.attached_instruments,
            attached_modules={
                k: [
                    SimulatingModule(serial_number=m.serial_number, model=m.model)
                    for m in v
                ]
                for k, v in setup.attached_modules.items()
            },
            config=setup.config,
            strict_attached_instruments=setup.strict_attached_instruments,
            loop=loop,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )


async def create_simulator(
    setup: SimulatorSetup, loop: Optional[asyncio.AbstractEventLoop] = None
) -> HardwareControlAPI:
    """Create a simulator"""
    simulator = await _simulator_for_setup(setup, loop)
    for attached_module in simulator.attached_modules:
        modules = setup.attached_modules[attached_module.name()]
        for module in modules:
            if module.serial_number == attached_module.device_info.get("serial"):
                for call in module.calls:
                    f = getattr(attached_module, call.function_name)
                    await f(*call.args, **call.kwargs)

    return simulator


async def load_simulator(
    path: Path, loop: Optional[asyncio.AbstractEventLoop] = None
) -> HardwareControlAPI:
    """Create a simulator from a JSON file."""
    return await create_simulator(setup=load_simulator_setup(path), loop=loop)


def _thread_manager_for_setup(
    setup: SimulatorSetup,
) -> ThreadManager[HardwareControlAPI]:
    if setup.machine == "OT-2 Standard":
        return ThreadManager(
            API.build_hardware_simulator,
            attached_instruments=setup.attached_instruments,
            attached_modules={
                k: [
                    SimulatingModule(serial_number=m.serial_number, model=m.model)
                    for m in v
                ]
                for k, v in setup.attached_modules.items()
            },
            config=setup.config,
            strict_attached_instruments=setup.strict_attached_instruments,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )
    else:
        from opentrons.hardware_control.ot3api import OT3API

        return ThreadManager(
            OT3API.build_hardware_simulator,
            attached_instruments=setup.attached_instruments,
            attached_modules={
                k: [
                    SimulatingModule(serial_number=m.serial_number, model=m.model)
                    for m in v
                ]
                for k, v in setup.attached_modules.items()
            },
            config=setup.config,
            strict_attached_instruments=setup.strict_attached_instruments,
            feature_flags=HardwareFeatureFlags.build_from_ff(),
        )


async def create_simulator_thread_manager(
    setup: SimulatorSetup,
) -> ThreadManager[HardwareControlAPI]:
    """Create a simulator thread manager from a loaded config."""
    thread_manager = _thread_manager_for_setup(setup)
    await thread_manager.managed_thread_ready_async()

    for attached_module in thread_manager.wrapped().attached_modules:
        modules = setup.attached_modules[attached_module.name()]
        for module in modules:
            for call in module.calls:
                f = getattr(attached_module, call.function_name)
                await f(*call.args, **call.kwargs)

    return thread_manager


async def load_simulator_thread_manager(
    path: Path,
) -> ThreadManager[HardwareControlAPI]:
    """Create a simulator wrapped in a ThreadManager from a JSON file."""
    return await create_simulator_thread_manager(load_simulator_setup(path))


def save_simulator_setup(simulator_setup: SimulatorSetup, path: Path) -> None:
    """Write a simulator setup to a file."""
    no_config = replace(simulator_setup, config=None)
    as_dict = asdict(no_config)

    as_dict["config"] = (
        robot_configs.config_to_save(simulator_setup.config)
        if simulator_setup.config
        else None
    )

    if as_dict.get("attached_instruments", None):
        as_dict["attached_instruments"] = {
            mount.name.lower(): data
            for mount, data in as_dict["attached_instruments"].items()
        }

    with path.open("w") as f:
        json.dump(as_dict, f)


def load_simulator_setup(path: Path) -> SimulatorSetup:
    """Load a simulator setup from a file."""
    with path.open() as f:
        obj = json.load(f)

    if "machine" not in obj:
        warn(
            "Simulator configuration does not name a machine, defaulting to OT-2 Standard"
        )
    machine_type = obj.get("machine", "OT-2 Standard")
    if machine_type == "OT-2 Standard":
        return OT2SimulatorSetup(
            **{k: _prepare_for_simulator_setup(k, v) for (k, v) in obj.items()}
        )
    else:
        return OT3SimulatorSetup(
            **{k: _prepare_for_ot3_simulator_setup(k, v) for (k, v) in obj.items()}
        )


def _prepare_for_simulator_setup(key: str, value: Dict[str, Any]) -> Any:
    """Convert value to a SimulatorSetup"""
    if key == "attached_instruments" and value:
        return {Mount[mount.upper()]: data for (mount, data) in value.items()}
    if key == "config" and value:
        return robot_configs.build_config_ot2(value)
    if key == "attached_modules" and value:
        attached_modules: Dict[str, List[ModuleItem]] = {}
        for key, item in value.items():
            for obj in item:
                attached_modules.setdefault(key, []).append(
                    ModuleItem(
                        serial_number=obj["serial_number"],
                        model=obj["model"],
                        calls=[ModuleCall(**data) for data in obj["calls"]],
                    )
                )

        return attached_modules

    return value


def _prepare_for_ot3_simulator_setup(key: str, value: Dict[str, Any]) -> Any:
    if key == "attached_instruments" and value:
        return {OT3Mount[mount.upper()]: data for (mount, data) in value.items()}
    if key == "config" and value:
        return robot_configs.build_config_ot3(value)
    if key == "attached_modules" and value:
        attached_modules: Dict[str, List[ModuleItem]] = {}
        for key, item in value.items():
            for obj in item:
                attached_modules.setdefault(key, []).append(
                    ModuleItem(
                        serial_number=obj["serial_number"],
                        model=obj["model"],
                        calls=[ModuleCall(**data) for data in obj["calls"]],
                    )
                )

        return attached_modules
    return value
