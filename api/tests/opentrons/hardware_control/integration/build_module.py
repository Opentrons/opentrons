"""Build a module emulator for integration tests."""
import asyncio
from typing import Optional, Type, TypeVar, cast

from opentrons.drivers.rpi_drivers.types import USBPort, PortGroup
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import AbstractModule

ModuleType = TypeVar("ModuleType", bound=AbstractModule)


async def build_module(
    module_cls: Type[ModuleType],
    *,
    port: int,
    execution_manager: ExecutionManager,
    poll_interval_seconds: Optional[float] = None,
) -> ModuleType:
    """Build a module emulator connected to a RFC-2217 network serial port.

    Args:
        module_cls: The module to build.
        port: The TCP port to connect on.
        execution_manager: Passed through to module builder.
        poll_interval_seconds: Passed through to module builder.

    Returns:
        The module's hardware control interface.
    """
    module = await module_cls.build(
        port=f"socket://127.0.0.1:{port}",
        execution_manager=execution_manager,
        usb_port=USBPort(
            name="",
            port_number=1,
            port_group=PortGroup.UNKNOWN,
            device_path="",
            hub=False,
            hub_port=None,
        ),
        hw_control_loop=asyncio.get_running_loop(),
        poll_interval_seconds=poll_interval_seconds,
    )

    return cast(ModuleType, module)
