"""Complete FW updater."""
import logging
import asyncio
import os
from typing import Optional, Dict, Tuple, AsyncIterator, Any
from .types import FirmwareUpdateStatus, StatusElement

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateStartApp,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    EnterBootloaderRequest,
)
from opentrons_hardware.firmware_update import (
    FirmwareUpdateInitiator,
    FirmwareUpdateDownloader,
    FirmwareUpdateEraser,
    HexRecordProcessor,
)
from opentrons_hardware.firmware_update.errors import BootloaderNotReady
from opentrons_hardware.firmware_update.target import Target

logger = logging.getLogger(__name__)
DFU_PID = "df11"


class RunUpdate:
    """Class for updating robot microcontroller firmware."""

    def __init__(
        self,
        messenger: CanMessenger,
        update_details: Dict[NodeId, str],
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
    ) -> None:
        """Initialize RunUpdate class.

        Args:
            messenger: The can messenger to use.
            update_details: Dict of nodes to be updated and their firmware files.
            retry_count: Number of times to retry.
            timeout_seconds: How much to wait for responses.
            erase: Whether to erase flash before updating.

        Returns:
            None
        """
        self._messenger = messenger
        self._update_details = update_details
        self._retry_count = retry_count
        self._timeout_seconds = timeout_seconds
        self._erase = erase
        self._status_dict = {
            node_id: (FirmwareUpdateStatus.queued, 0)
            for node_id in update_details.keys()
        }
        self._status_queue: "asyncio.Queue[Tuple[NodeId,StatusElement]]" = (
            asyncio.Queue()
        )

    async def _run_update(
        self,
        messenger: CanMessenger,
        node_id: NodeId,
        filepath: str,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
    ) -> None:
        """Perform a firmware update on a node target."""
        if not os.path.exists(filepath):
            logger.error(f"Subsystem update file not found {filepath}")
            raise FileNotFoundError

        initiator = FirmwareUpdateInitiator(messenger)
        downloader = FirmwareUpdateDownloader(messenger)

        target = Target(system_node=node_id)

        logger.info(f"Initiating FW Update on {target}.")
        await self._status_queue.put((node_id, (FirmwareUpdateStatus.updating, 0)))

        await initiator.run(
            target=target,
            retry_count=retry_count,
            ready_wait_time_sec=timeout_seconds,
        )
        download_start_progress = 0.1
        await self._status_queue.put(
            (node_id, (FirmwareUpdateStatus.updating, download_start_progress))
        )

        if erase:
            eraser = FirmwareUpdateEraser(messenger)
            logger.info(f"Erasing existing FW Update on {target}.")

            try:
                await eraser.run(
                    node_id=target.bootloader_node,
                    timeout_sec=timeout_seconds,
                )
                download_start_progress = 0.2
                await self._status_queue.put(
                    (
                        node_id,
                        (FirmwareUpdateStatus.updating, download_start_progress),
                    )
                )
            except BootloaderNotReady as e:
                logger.error(f"Firmware Update failed for {target} {e}.")
                await self._status_queue.put(
                    (
                        node_id,
                        (FirmwareUpdateStatus.updating, download_start_progress),
                    )
                )
                return
        else:
            logger.info("Skipping erase step.")

        logger.info(f"Downloading FW to {target.bootloader_node}.")
        with open(filepath) as f:
            hex_processor = HexRecordProcessor.from_file(f)
            async for download_progress in downloader.run(
                node_id=target.bootloader_node,
                hex_processor=hex_processor,
                ack_wait_seconds=timeout_seconds,
            ):
                await self._status_queue.put(
                    (
                        node_id,
                        (
                            FirmwareUpdateStatus.updating,
                            download_start_progress
                            + (0.9 - download_start_progress) * download_progress,
                        ),
                    )
                )

        logger.info(f"Restarting FW on {target.system_node}.")
        await messenger.send(
            node_id=target.bootloader_node,
            message=FirmwareUpdateStartApp(),
        )
        await self._status_queue.put((node_id, (FirmwareUpdateStatus.done, 1)))

    async def run_updates(
        self,
    ) -> AsyncIterator[Tuple[NodeId, StatusElement]]:
        """Perform a firmware update on multiple node targets."""
        tasks = [
            self._run_update(
                messenger=self._messenger,
                node_id=node_id,
                filepath=filepath,
                retry_count=self._retry_count,
                timeout_seconds=self._timeout_seconds,
                erase=self._erase,
            )
            for node_id, filepath in self._update_details.items()
        ]

        task = asyncio.gather(*tasks)
        while True:
            try:
                yield await asyncio.wait_for(self._status_queue.get(), 0.25)
            except asyncio.TimeoutError:
                pass
            if task.done():
                break


async def find_dfu_device(pid: str, expected_device_count: int) -> str:
    """Find the dfu device and return its serial number (separate from module serial).

    Args:
        pid: The USB Product ID of the device
        expected_device_count: The expected number of "devices" for dfu-util
        to find for this PID. This is necessary because most STM32 MCU's
        will enumerate with multiple DFU devices, representing the
        separate programmable memory regions on the device. If more than
        this many devices are found, it is assumed that either the wrong
        module is in DFU mode *or* multiple modules are in DFU mode.
    """
    retries = 5
    logger.info(f"Searching for a dfu device with PID {pid}")
    while retries != 0:
        retries -= 1
        await asyncio.sleep(1)
        proc = await asyncio.create_subprocess_exec(
            "dfu-util",
            "-l",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.wait()
        stdout, stderr = await proc.communicate()

        if stdout is None and stderr is None:
            continue
        if stderr:
            raise RuntimeError(f"Error finding dfu device: {stderr.decode()}")

        result = stdout.decode()
        if pid not in result:
            # It could take a few seconds for the device to show up
            continue
        devices_found = 0
        for line in result.splitlines():
            if pid in line:
                logger.info(f"Found device with PID {pid}")
                devices_found += 1
                serial = line[(line.find("serial=") + 7) :]
        if devices_found == expected_device_count:
            # rear panel has 3? endpoints
            return serial
        elif devices_found > expected_device_count:
            raise OSError("Multiple new bootloader devices" "found on mode switch")

    raise RuntimeError(
        "Could not update firmware via dfu. Possible issues- dfu-util"
        " not working or specified dfu device not found"
    )


async def upload_via_dfu(
    dfu_serial: str, firmware_file_path: str, kwargs: Dict[str, Any]
) -> Tuple[bool, str]:
    """Run firmware upload command for DFU.

    Unlike other firmware upload methods, this one doesn't take a `port` argument since
    the module isn't recognized as a cdc device in dfu mode and hence doesn't get
    a port. The firmware upload utility, dfu-util, looks for the specific module
    by searching for available dfu devices. Since we check beforehand that only one
    dfu device is available during the upload process, this check is sufficient for us.

    In the future, if we want to make sure that the dfu device available is in fact
    the one we seek, then we can ask dfu-util to check for available dfu devices with
    a specific serial number (unrelated to Opentrons' module serial numbers).
    Hence, this method takes a `dfu_serial` argument instead.

    Returns tuple of success boolean and message from bootloader
    """
    logger.info("Starting firmware upload via dfu util")
    dfu_args = [
        "dfu-util",
        "-a 0",
        "-s 0x08000000:leave",
        f"-D{firmware_file_path}",
        "-R",
    ]
    proc = await asyncio.create_subprocess_exec(*dfu_args, **kwargs)
    stdout, stderr = await proc.communicate()
    res = stdout.decode()

    if "File downloaded successfully" in res:
        logger.debug(res)
        logger.info("Firmware upload successful")
        return True, res
    else:
        logger.error(
            f"Failed to update module firmware for {dfu_serial}. "
            # It isn't easy to decipher the issue from stderror alone
            f"stdout: {res} \n"
            f"stderr: {stderr.decode()}"
        )
        return False, res


class RunUSBUpdate:
    """Class for updating robot microcontroller connected over usb."""

    def __init__(
        self,
        messenger: BinaryMessenger,
        update_file: str,
        retry_count: int,
        timeout_seconds: float,
    ) -> None:
        """Initialize RunUSBUpdate class.

        Args:
            messenger: The binary usb messenger to use.
            update_file: firmware file to use.
            retry_count: Number of times to retry.
            timeout_seconds: How much to wait for responses.

        Returns:
            None
        """
        self._messenger = messenger
        self._update_file = update_file
        self._retry_count = retry_count
        self._timeout_seconds = timeout_seconds

    async def run_update(self) -> bool:
        """Perform a firmware update on a connected USB device."""
        vid, pid, baudrate, timeout = self._messenger.get_driver().get_connection_info()
        for i in range(self._retry_count):
            logger.info(f"Running attempt number {i} to update device {vid}:{pid}")
            if not await self._messenger.send(EnterBootloaderRequest()):
                logger.error("unable to send enter bootloader message")
                continue

            dfu_dev_serial = await find_dfu_device(DFU_PID, 1)
            kwargs: Dict[str, Any] = {
                "stdout": asyncio.subprocess.PIPE,
                "stderr": asyncio.subprocess.PIPE,
                "loop": asyncio.get_running_loop(),
            }
            success, msg = await upload_via_dfu(
                dfu_dev_serial, self._update_file, kwargs
            )
            if success:
                logger.info(f"Device {vid}:{pid} updated successfully with {msg}")
                self._messenger.get_driver().find_and_connect(
                    vid, pid, baudrate, timeout
                )
                device_running = self._messenger.get_driver().connected()
                if device_running:
                    logger.error("device did not restart properly")
                else:
                    logger.info("device is reconnected")
                return success and device_running
            else:
                continue
        return False
