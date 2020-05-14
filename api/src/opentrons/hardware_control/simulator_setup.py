from typing import Dict, Optional, Any, List
from dataclasses import dataclass, asdict, field
import json
from pathlib import Path

from opentrons.config import robot_configs
from opentrons.types import Mount
from opentrons.hardware_control import API


# Name and kwargs for a module function
@dataclass(frozen=True)
class ModuleCall:
    function_name: str
    args: List[Any] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SimulatorSetup:
    attached_instruments: Dict[Mount, Dict[str, Optional[str]]] =\
        field(default_factory=dict)
    attached_modules: Dict[str, List[ModuleCall]] = field(default_factory=dict)
    config: Optional[robot_configs.robot_config] = None
    strict_attached_instruments: bool = True


async def create_simulator(setup: SimulatorSetup, loop=None) -> API:
    simulator = await API.build_hardware_simulator(
        attached_instruments=setup.attached_instruments,
        attached_modules=list(setup.attached_modules.keys()),
        config=setup.config,
        strict_attached_instruments=setup.strict_attached_instruments,
        loop=loop,
    )

    for attached_module in simulator.attached_modules:
        calls = setup.attached_modules[attached_module.name()]
        for call in calls:
            f = getattr(attached_module, call.function_name)
            await f(*call.args, **call.kwargs)

    return simulator


async def load_simulator(path: Path, loop=None) -> API:
    return await create_simulator(setup=load_simulator_setup(path),
                                  loop=None)


def save_simulator_setup(simulator_setup: SimulatorSetup, path: Path):
    """Write a simulator setup to a file."""
    as_dict = asdict(simulator_setup)
    as_dict = {k: _prepare_for_dict(k, v) for (k, v) in as_dict.items()}
    with path.open('w') as f:
        json.dump(as_dict, f)


def load_simulator_setup(path: Path) -> SimulatorSetup:
    """Load a simulator setup from a file."""
    with path.open() as f:
        obj = json.load(f)
        return SimulatorSetup(
            **{k: _prepare_for_simulator_setup(k, v) for (k, v)
               in obj.items()})


def _prepare_for_dict(key, value):
    """Convert an element in SimulatorSetup to be a serializable dict"""
    if key == 'attached_instruments' and value:
        return {mount.name: data for (mount, data) in value.items()}
    if key == 'config' and value:
        return robot_configs.config_to_save(value)[1]
    return value


def _prepare_for_simulator_setup(key, value):
    """Convert """
    if key == 'attached_instruments' and value:
        return {Mount[mount.upper()]: data for (mount, data) in value.items()}
    if key == 'config' and value:
        return robot_configs.build_config([], value)
    if key == 'attached_modules' and value:
        return {k: [ModuleCall(**data) for data in v] for (k, v)
                in value.items()}
    return value
