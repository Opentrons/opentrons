"""Build a module emulator for integration tests."""
import asyncio
import logging
from typing import Optional, Type, TypeVar, cast

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import AbstractModule


_CONNECT_RETRIES = 3

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

    This factory will retry the build if it fails.
    This is to account for the fact that the network-based serial connections
    used by the emulators cannot always close and re-open a socket immediately.

    See https://pyserial.readthedocs.io/en/latest/pyserial_api.html#rfc-2217-network-ports.

    Args:
        module_cls: The module to build.
        port: The TCP port to connect on.
        execution_manager: Passed through to module builder.
        poll_interval_seconds: Passed through to module builder.

    Returns:
        The module's hardware control interface.

    Raises:
        AssertionError: The module was not able to be built, even after retries.
    """
    module = None
    retry_attempt = 1

    # Closing and re-opening network-based serial connections does not always work
    # Attempt to connect to the driver several times to prevent test flakiness
    # https://pyserial.readthedocs.io/en/latest/pyserial_api.html#rfc-2217-network-ports
    while module is None and retry_attempt <= _CONNECT_RETRIES:
        try:
            module = await module_cls.build(
                port=f"socket://127.0.0.1:{port}",
                execution_manager=execution_manager,
                usb_port=USBPort(name="", port_number=1, device_path="", hub=1),
                hw_control_loop=asyncio.get_running_loop(),
                poll_interval_seconds=poll_interval_seconds,
            )
        except Exception as e:
            _log.warning(f"Module build attempt {retry_attempt} failed.", exc_info=e)
            retry_attempt += 1

    assert module is not None, f"Failed to build module after {_CONNECT_RETRIES} tries."
    return cast(ModuleType, module)
