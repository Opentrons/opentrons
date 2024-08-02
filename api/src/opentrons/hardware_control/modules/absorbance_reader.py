import asyncio
from typing import Optional, Mapping, List, Dict, Any, Tuple

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.absorbance_reader import (
    AbstractAbsorbanceReaderDriver,
    AbsorbanceReaderDriver,
    SimulatingDriver,
)
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
    AbsorbanceReaderDeviceState,
)

from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.poller import Reader, Poller
from opentrons.hardware_control.modules import mod_abc
from opentrons.hardware_control.modules.types import (
    ModuleType,
    AbsorbanceReaderStatus,
    LiveData,
    UploadFunction,
)


ABS_POLL_INTERVAL_SECS = 1.0
SIM_ABS_POLL_INTERVAL_SECS = ABS_POLL_INTERVAL_SECS / 20.0


class AbsorbanceReaderReader(Reader):
    """Reads data from an attached Absorbance Reader Module."""

    device_state: AbsorbanceReaderDeviceState
    lid_status: AbsorbanceReaderLidStatus
    plate_presence: AbsorbanceReaderPlatePresence
    supported_wavelengths: List[int]

    def __init__(self, driver: AbstractAbsorbanceReaderDriver) -> None:
        self.device_state = AbsorbanceReaderDeviceState.UNKNOWN
        self.lid_status = AbsorbanceReaderLidStatus.UNKNOWN
        self.plate_presence = AbsorbanceReaderPlatePresence.UNKNOWN
        self.supported_wavelengths = []
        self._driver = driver

    async def read(self) -> None:
        await self.get_device_status()
        await self.get_supported_wavelengths()
        await self.get_lid_status()
        await self.get_plate_presence()

    async def get_device_status(self) -> None:
        """Get the Absorbance Reader's current status."""
        self.device_state = await self._driver.get_status()

    async def get_supported_wavelengths(self) -> None:
        """Get the Absorbance Reader's supported wavelengths."""
        self.supported_wavelengths = await self._driver.get_available_wavelengths()

    async def get_lid_status(self) -> None:
        """Get the Absorbance Reader's lid status."""
        self.lid_status = await self._driver.get_lid_status()

    async def get_plate_presence(self) -> None:
        """Get the Absorbance Reader's plate presence."""
        self.plate_presence = await self._driver.get_plate_presence()


async def upload_func_placeholder(
    dfu_serial: str, firmware_file_path: str, kwargs: Dict[str, Any]
) -> Tuple[bool, str]:
    return False, "Not implemented"


class AbsorbanceReader(mod_abc.AbstractModule):
    """Hardware control interface for an attached Absorbance Reader module."""

    MODULE_TYPE = ModuleType.ABSORBANCE_READER

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        hw_control_loop: asyncio.AbstractEventLoop,
        poll_interval_seconds: Optional[float] = None,
        simulating: bool = False,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
    ) -> "AbsorbanceReader":
        """Create an AbsorbanceReader."""
        driver: AbstractAbsorbanceReaderDriver
        if not simulating:
            driver = await AbsorbanceReaderDriver.create(
                port, usb_port, hw_control_loop
            )
            poll_interval_seconds = poll_interval_seconds or ABS_POLL_INTERVAL_SECS
        else:
            driver = SimulatingDriver(serial_number=sim_serial_number)
            poll_interval_seconds = poll_interval_seconds or SIM_ABS_POLL_INTERVAL_SECS
        reader = AbsorbanceReaderReader(driver=driver)
        poller = Poller(reader=reader, interval=poll_interval_seconds)
        module = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            reader=reader,
            poller=poller,
            device_info=await driver.get_device_info(),
            execution_manager=execution_manager,
            hw_control_loop=hw_control_loop,
        )
        await module.setup()
        return module

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractAbsorbanceReaderDriver,
        reader: AbsorbanceReaderReader,
        poller: Poller,
        device_info: Mapping[str, str],
        hw_control_loop: asyncio.AbstractEventLoop,
    ) -> None:
        super().__init__(port, usb_port, execution_manager, hw_control_loop)
        self._driver = driver
        self._reader = reader
        self._poller = poller
        self._device_info = device_info

    async def deactivate(self, must_be_running: bool = True) -> None:
        """Deactivate the module.

        Contains an override to the `wait_for_is_running` step in cases where the
        module must be deactivated regardless of context."""
        await self._driver.disconnect()

    @property
    def status(self) -> AbsorbanceReaderStatus:
        """Return some string describing status."""
        return AbsorbanceReaderStatus.IDLE

    @property
    def lid_status(self) -> AbsorbanceReaderLidStatus:
        return self._reader.lid_status

    @property
    def plate_presence(self) -> AbsorbanceReaderPlatePresence:
        return self._reader.plate_presence

    @property
    def device_info(self) -> Mapping[str, str]:
        """Return a dict of the module's static information (serial, etc)"""
        return self._device_info

    @property
    def live_data(self) -> LiveData:
        """Return a dict of the module's dynamic information"""
        return {
            "status": self.status.value,
            "data": {
                "lidStatus": self.lid_status.value,
                "platePresence": self.plate_presence.value,
                "sampleWavelength": 400,
            },
        }

    @property
    def is_simulated(self) -> bool:
        """True if this is a simulated module."""
        return isinstance(self._driver, SimulatingDriver)

    @property
    def port(self) -> str:
        """The virtual port where the module is connected."""
        return self._port

    @property
    def usb_port(self) -> USBPort:
        """The physical port where the module is connected."""
        return self._usb_port

    async def wait_for_is_running(self) -> None:
        if not self.is_simulated:
            await self._execution_manager.wait_for_is_running()

    async def prep_for_update(self) -> str:
        """Prepare for an update.

        By the time this coroutine completes, the hardware should be ready
        to take an update. This implicitly tears down the module instance;
        it does not need to be either working or recoverable after this
        coroutine completes.

        :returns str: The port we're running on.
        """
        return ""

    def model(self) -> str:
        """A name for this specific module, matching module defs"""
        return "absorbanceReaderV1"

    @classmethod
    def name(cls) -> str:
        """A shortname used for matching usb ports, among other things"""
        return "absorbancereader"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        # TODO: (AA) This is a placeholder
        return ""

    def bootloader(self) -> UploadFunction:
        """Bootloader mode"""
        return upload_func_placeholder

    async def cleanup(self) -> None:
        """Clean up the module instance.

        Clean up, i.e. stop pollers, disconnect serial, etc in preparation for
        object destruction.
        """
        await self._poller.stop()
        await self._driver.disconnect()

    async def set_sample_wavelength(self, wavelength: int) -> None:
        """Set the Absorbance Reader's active wavelength."""
        await self._driver.initialize_measurement(wavelength)

    async def start_measure(self, wavelength: int) -> List[float]:
        """Initiate a single measurement."""
        return await self._driver.get_single_measurement(wavelength)

    async def setup(self) -> None:
        """Setup the Absorbance Reader."""
        is_open = await self._driver.is_connected()
        if not is_open:
            await self._driver.connect()

    async def get_current_wavelength(self) -> None:
        """Get the Absorbance Reader's current active wavelength."""
        pass

    async def get_current_lid_status(self) -> AbsorbanceReaderLidStatus:
        """Get the Absorbance Reader's current lid status."""
        await self._reader.get_lid_status()
        return self._reader.lid_status
