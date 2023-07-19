"""Complete FW updater."""
import logging
import asyncio
import os
from typing import Optional, Dict, Tuple, AsyncIterator, Any


from opentrons_shared_data.errors.exceptions import (
    InternalUSBCommunicationError,
    FirmwareUpdateFailedError,
    EnumeratedError,
    PythonException,
)

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings import (
    NodeId,
    FirmwareTarget,
    USBTarget,
)
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
from .types import FirmwareUpdateStatus, StatusElement

logger = logging.getLogger(__name__)
DFU_PID = "df11"


async def find_dfu_device(pid: str, expected_device_count: int) -> str:
    """Find the dfu device and return its serial number.

    Args:
        pid: The USB Product ID of the device
        expected_device_count: The expected number of "devices" for dfu-util
        to find for this PID. This is necessary because most STM32 MCU's
        will enumerate with multiple DFU devices, representing the
        separate programmable memory regions on the device. If more than
        this many devices are found, it is assumed that either the wrong
        device is in DFU mode *or* multiple device are in DFU mode.
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
            raise BootloaderNotReady(
                USBTarget.rear_panel,
                wrapping=[
                    InternalUSBCommunicationError(
                        message="Error finding dfu device",
                        detail={"stderr": stderr.decode(), "target-pid": pid},
                    )
                ],
            )

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
            # rear panel has 3 endpoints
            return serial
        elif devices_found > expected_device_count:
            raise BootloaderNotReady(
                USBTarget.rear_panel,
                wrapping=[
                    InternalUSBCommunicationError(
                        message="Multiple new bootloader devices found on mode switch",
                        detail={"devices": result, "target-pid": pid},
                    )
                ],
            )

    raise BootloaderNotReady(
        USBTarget.rear_panel,
        wrapping=[
            InternalUSBCommunicationError(
                message="Could not find dfu device to update firmware. dfu-util may be broken or the device may not be present.",
                detail={"target-pid": pid},
            )
        ],
    )


async def upload_via_dfu(
    dfu_serial: str, firmware_file_path: str, kwargs: Dict[str, Any]
) -> Tuple[bool, str]:
    """Run firmware upload command for DFU.

    Unlike other firmware upload methods, this one doesn't take a `port` argument since
    the board isn't recognized as a cdc device in dfu mode and hence doesn't get
    a port. The firmware upload utility, dfu-util, looks for the specific board
    by searching for available dfu devices. Since we check beforehand that only one
    dfu device is available during the upload process, this check is sufficient for us.

    In the future, if we want to make sure that the dfu device available is in fact
    the one we seek, then we can ask dfu-util to check for available dfu devices with
    a specific serial number (unrelated to Opentrons' board serial numbers).
    Hence, this method takes a `dfu_serial` argument instead.

    Returns tuple of success boolean and message from bootloader
    """
    logger.info("Starting firmware upload via dfu util")
    dfu_args = [
        "dfu-util",
        "-a 0",
        "-s 0x08008000:leave",
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
            f"Failed to update rear-panel firmware for {dfu_serial}. "
            # It isn't easy to decipher the issue from stderror alone
            f"stdout: {res} \n"
            f"stderr: {stderr.decode()}"
        )
        return False, res


class RunUpdate:
    """Class for updating robot microcontroller firmware."""

    def __init__(
        self,
        can_messenger: CanMessenger,
        usb_messenger: Optional[BinaryMessenger],
        update_details: Dict[FirmwareTarget, str],
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
        erase_timeout_seconds: float = 60,
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
        self._can_messenger = can_messenger
        self._usb_messenger = usb_messenger
        self._update_details = update_details
        self._retry_count = retry_count
        self._timeout_seconds = timeout_seconds
        self._erase = erase
        self._erase_timeout_seconds = erase_timeout_seconds
        self._status_dict = {
            target: (FirmwareUpdateStatus.queued, 0) for target in update_details.keys()
        }
        self._status_queue: "asyncio.Queue[Tuple[FirmwareTarget,StatusElement]]" = (
            asyncio.Queue()
        )

    async def _reconnect(self, vid: int, pid: int, baudrate: int, timeout: int) -> bool:
        if self._usb_messenger is None:
            return False

        device_running = False
        for i in range(self._retry_count):
            logger.info(f"attempt #{i} to reconnect")
            # it takes a ~5 seconds for it to reconnect as the startup app copies over the backup image
            await asyncio.sleep(5)
            try:
                self._usb_messenger.get_driver().find_and_connect(
                    vid, pid, baudrate, timeout
                )
                device_running = self._usb_messenger.get_driver().connected()
                if device_running:
                    logger.info("device is reconnected")
                    self._usb_messenger.start()
                    break
                else:
                    logger.error("device did not restart properly")
            except IOError:
                pass
        return device_running

    async def _run_usb_update(
        self,
        messenger: BinaryMessenger,
        retry_count: int,
        update_file: str,
        usb_target: USBTarget,
    ) -> None:
        await self._status_queue.put(
            (usb_target, (FirmwareUpdateStatus.updating, 0.01))
        )
        vid, pid, baudrate, timeout = messenger.get_driver().get_connection_info()
        await self._status_queue.put((usb_target, (FirmwareUpdateStatus.updating, 0.2)))
        for i in range(retry_count):
            logger.info(
                f"Running attempt number {i} to update device {vid:04x}:{pid:04x}"
            )
            if not await messenger.send(EnterBootloaderRequest()):
                logger.error("unable to send enter bootloader message")
                continue
            await messenger.stop()
            await self._status_queue.put(
                (usb_target, (FirmwareUpdateStatus.updating, 0.4))
            )
            dfu_dev_serial = await find_dfu_device(DFU_PID, 3)
            await self._status_queue.put(
                (usb_target, (FirmwareUpdateStatus.updating, 0.5))
            )
            kwargs: Dict[str, Any] = {
                "stdout": asyncio.subprocess.PIPE,
                "stderr": asyncio.subprocess.PIPE,
                "loop": asyncio.get_running_loop(),
            }
            success, msg = await upload_via_dfu(dfu_dev_serial, update_file, kwargs)
            if success:
                await self._status_queue.put(
                    (usb_target, (FirmwareUpdateStatus.updating, 0.9))
                )
                logger.info(
                    f"Device {vid:04x}:{pid:04x} updated successfully with {msg}"
                )
                await self._reconnect(vid, pid, baudrate, timeout)
                await self._status_queue.put(
                    (usb_target, (FirmwareUpdateStatus.done, 1))
                )
                break
            else:
                continue

    async def _prep_can_update(
        self,
        messenger: CanMessenger,
        node_id: NodeId,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool],
        erase_timeout_seconds: float = 60,
    ) -> float:

        target = Target.from_single_node(node_id)

        logger.info(f"Initiating FW Update on {target}.")
        await self._status_queue.put((node_id, (FirmwareUpdateStatus.updating, 0)))

        await FirmwareUpdateInitiator(messenger).run(
            target=target,
            retry_count=retry_count,
            ready_wait_time_sec=timeout_seconds,
        )

        prep_progress = 0.1
        await self._status_queue.put(
            (node_id, (FirmwareUpdateStatus.updating, prep_progress))
        )

        if erase:
            eraser = FirmwareUpdateEraser(messenger)
            logger.info(f"Erasing existing FW Update on {target}.")

            try:
                await eraser.run(
                    node_id=target.bootloader_node,
                    timeout_sec=erase_timeout_seconds,
                )
                prep_progress = 0.2
                await self._status_queue.put(
                    (
                        node_id,
                        (FirmwareUpdateStatus.updating, prep_progress),
                    )
                )
            except BaseException as e:
                logger.error(f"Firmware Update failed for {target} {e}.")
                await self._status_queue.put(
                    (
                        node_id,
                        (FirmwareUpdateStatus.updating, prep_progress),
                    )
                )
                if isinstance(e, FirmwareUpdateFailedError):
                    raise
                elif isinstance(e, EnumeratedError):
                    raise FirmwareUpdateFailedError(
                        message="Device did not enter bootloader",
                        detail={"node": target.bootloader_node.application_for().name},
                        wrapping=[e],
                    )
                else:
                    raise FirmwareUpdateFailedError(
                        "Unhandled exception during firmware update",
                        detail={"node": target.bootloader_node.application_for().name},
                        wrapping=[PythonException(e)],
                    )
        else:
            logger.info("Skipping erase step.")
        return prep_progress

    async def _run_can_update(
        self,
        messenger: CanMessenger,
        node_id: NodeId,
        filepath: str,
        retry_count: int,
        timeout_seconds: float,
        erase: Optional[bool] = True,
        erase_timeout_seconds: float = 60,
    ) -> None:
        """Perform a firmware update on a node target."""
        if not os.path.exists(filepath):
            logger.error(f"Subsystem update file not found {filepath}")
            raise FirmwareUpdateFailedError(
                message="Subsystem update file not found",
                detail={"filepath": filepath, "target": node_id.application_for().name},
            )

        download_start_progress = await self._prep_can_update(
            messenger,
            node_id,
            retry_count,
            timeout_seconds,
            erase,
            erase_timeout_seconds,
        )

        target = Target.from_single_node(node_id)
        logger.info(f"Downloading {filepath} to {target.bootloader_node}.")
        downloader = FirmwareUpdateDownloader(messenger)
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
    ) -> AsyncIterator[Tuple[FirmwareTarget, StatusElement]]:
        """Perform a firmware update on multiple firmware targets."""
        can_tasks = [
            self._run_can_update(
                messenger=self._can_messenger,
                node_id=NodeId(target),
                filepath=filepath,
                retry_count=self._retry_count,
                timeout_seconds=self._timeout_seconds,
                erase=self._erase,
                erase_timeout_seconds=self._erase_timeout_seconds,
            )
            for target, filepath in self._update_details.items()
            if target in NodeId
        ]
        usb_tasks = []
        if self._usb_messenger is not None:
            usb_tasks = [
                self._run_usb_update(
                    messenger=self._usb_messenger,
                    retry_count=self._retry_count,
                    update_file=filepath,
                    usb_target=USBTarget(target),
                )
                for target, filepath in self._update_details.items()
                if target in USBTarget
            ]
        tasks = can_tasks + usb_tasks
        task = asyncio.gather(*tasks)
        while True:
            try:
                yield await asyncio.wait_for(self._status_queue.get(), 0.25)
            except asyncio.TimeoutError:
                pass
            if task.done():
                _ = task.result()
                break
