"""Build a module emulator for integration tests."""
import asyncio
import logging
from typing import Optional, Type, TypeVar, cast

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import AbstractModule


_log = logging.getLogger(__name__)

ModuleType = TypeVar("ModuleType", bound=AbstractModule)


async def build_module(
    module_cls: Type[ModuleType],
    *,
    port: int,
    execution_manager: ExecutionManager,
    poll_interval_seconds: Optional[float] = None,
) -> ModuleType:
    """Build a module emulator.

    Args:
        module_cls: The module to build.
        port: The TCP port to connect on.
        execution_manager: Passed through to module builder.
        poll_interval_seconds: Passed through to module builder.

    Returns:
        The module's hardware control interface.

    Raises:
        Exception: The module was not able to be built.
    """
    try:
        module = await module_cls.build(
            port=f"socket://127.0.0.1:{port}",
            execution_manager=execution_manager,
            usb_port=USBPort(name="", port_number=1, device_path="", hub=1),
            hw_control_loop=asyncio.get_running_loop(),
            poll_interval_seconds=poll_interval_seconds,
        )
    except Exception as e:
        _log.warn("Failed to build module", exc_info=e)
        raise

    return cast(ModuleType, module)
