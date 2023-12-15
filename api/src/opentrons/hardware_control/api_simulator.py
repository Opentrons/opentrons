"""Simulated implementation of hardware API protocol."""

from typing_extensions import Protocol
from typing import TypeVar, Optional, Union, List
import asyncio

from .protocols import FlexHardwareControlInterface, HardwareControlInterface
from .robot_calibration import RobotCalibration as OT2Transforms
from .ot3_calibration import OT3Transforms
from .execution_manager import ExecutionManagerProvider
from .util import use_or_initialize_loop

from opentrons.hardware_control.modules import AbstractModule, ModuleModel
from opentrons.hardware_control.module_control import modules

from .types import (
    DoorState,
    OT3Mount,
)
from opentrons.config.types import OT3Config, RobotConfig as OT2Config
from opentrons import types as top_types
from opentrons.drivers.rpi_drivers.types import USBPort, PortGroup


class _APISimulatorBase(ExecutionManagerProvider):
    _door_state: DoorState

    def __init__(
        self, attached_modules: List[AbstractModule], loop: asyncio.AbstractEventLoop
    ) -> None:
        self._door_state = DoorState.CLOSED
        self._attached_modules = attached_modules
        self._loop = use_or_initialize_loop(loop)
        ExecutionManagerProvider.__init__(self, True)

    @property
    def door_state(self) -> DoorState:
        return self._door_state

    @door_state.setter
    def door_state(self, door_state: DoorState) -> None:
        self._door_state = door_state

    async def get_serial_number(self) -> Optional[str]:
        return "simulator"

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """The event loop used by this instance."""
        return self._loop

    @property
    def is_simulator(self) -> bool:
        """`True` if this is a simulator; `False` otherwise."""
        return True

    def get_fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.
        """
        return "unknown"

    @property
    def fw_version(self) -> str:
        return self.get_fw_version()

    @property
    def board_revision(self) -> str:
        return "UNKNOWN"

    # Module provider

    @property
    def attached_modules(self) -> List[AbstractModule]:
        return self._attached_modules

    async def create_simulating_module(self, model: ModuleModel) -> AbstractModule:
        return await modules.build(
            port="",
            usb_port=USBPort(name="", port_number=1, port_group=PortGroup.LEFT),
            type=modules.ModuleType.from_model(model),
            simulating=True,
            hw_control_loop=self._loop,
            execution_manager=self._execution_manager,
            sim_model=model.value,
        )


class OT2APISimulator(
    _APISimulatorBase,
    HardwareControlInterface[OT2Transforms, top_types.Mount, OT2Config],
):
    ...


class OT3APISimulator(
    _APISimulatorBase,
    FlexHardwareControlInterface[
        OT3Transforms, Union[top_types.Mount, OT3Mount], OT3Config
    ],
):
    ...
