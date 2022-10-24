import asyncio
import logging
from typing import Mapping, Optional
from opentrons.drivers.mag_deck import (
    SimulatingDriver,
    MagDeckDriver,
    AbstractMagDeckDriver,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from ..execution_manager import ExecutionManager
from . import update, mod_abc, types

log = logging.getLogger(__name__)

MAX_ENGAGE_HEIGHT = {
    # Distance from home position.
    # Measured in model-specific units (half-mm for GEN1, mm for GEN2).
    "magneticModuleV1": 45,
    "magneticModuleV2": 25,
}

# Measured in model-specific units (half-mm for GEN1, mm for GEN2).
# TODO(mc, 2022-06-13): the value for gen1 is off by ~1.5 mm
# The correct value is ~8.0 half-mm (4.0 mm)
# https://opentrons.atlassian.net/browse/RET-1242
OFFSET_TO_LABWARE_BOTTOM = {"magneticModuleV1": 5, "magneticModuleV2": 2.5}


def engage_height_is_in_range(model: str, height: float) -> bool:
    """Return whether or not a height would be valid to pass to `MagDeck.engage()`.

    Args:
        model: The model of Magnetic Module for which you want to check
            the engage height.
        height: A height that you would provide to `MagDeck.engage()`.
    """
    return 0 <= height <= MAX_ENGAGE_HEIGHT[model]


class MagDeck(mod_abc.AbstractModule):
    """Hardware control interface for an attached Temperature Module."""

    MODULE_TYPE = types.ModuleType.MAGNETIC
    FIRST_GEN2_REVISION = 20

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
    ) -> "MagDeck":
        """Factory function."""
        driver: AbstractMagDeckDriver
        if not simulating:
            driver = await MagDeckDriver.create(port=port, loop=hw_control_loop)
        else:
            driver = SimulatingDriver(sim_model=sim_model)

        mod = cls(
            port=port,
            usb_port=usb_port,
            execution_manager=execution_manager,
            hw_control_loop=hw_control_loop,
            device_info=await driver.get_device_info(),
            driver=driver,
        )
        return mod

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        hw_control_loop: asyncio.AbstractEventLoop,
        driver: AbstractMagDeckDriver,
        device_info: Mapping[str, str],
    ) -> None:
        """Constructor"""
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
        )
        self._device_info = device_info
        self._driver = driver
        self._current_height = 0.0

    async def cleanup(self) -> None:
        await self._driver.disconnect()

    @classmethod
    def name(cls) -> str:
        """Get the module name."""
        return "magdeck"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        return "magnetic-module"

    def model(self) -> str:
        """Get the model."""
        return self._model_from_revision(self._device_info.get("model"))

    def bootloader(self) -> types.UploadFunction:
        """Get the bootloating method."""
        return update.upload_via_avrdude

    async def calibrate(self) -> None:
        """Calibration involves probing for top plate to get the plate height."""
        await self.wait_for_is_running()
        await self._driver.probe_plate()
        # return if successful or not?

    # TODO(mc, 2022-09-23): refactor this method to take real mm,
    # hardware API should abstract away the idea of "short millimeters"
    # https://opentrons.atlassian.net/browse/RET-1242
    async def engage(
        self,
        height: Optional[float] = None,
        height_from_base: Optional[float] = None,
    ) -> None:
        """Move the magnet to a specific height, measured from home position.

        The units of position depend on the module model.
        For GEN1, it's half millimeters ("short millimeters").
        For GEN2, it's millimeters.
        """
        if height is None:
            assert height_from_base is not None, "An engage height must be specified"
            height = height_from_base + OFFSET_TO_LABWARE_BOTTOM[self.model()]

        await self.wait_for_is_running()
        if not engage_height_is_in_range(self.model(), height):
            raise ValueError(
                f"Invalid engage height for {self.model()}: {height}. "
                f"Must be 0 - {MAX_ENGAGE_HEIGHT[self.model()]}."
            )
        await self._driver.move(height)
        self._current_height = await self._driver.get_mag_position()

    async def deactivate(self) -> None:
        """Home the magnet."""
        await self.wait_for_is_running()
        await self._driver.home()
        await self.engage(0.0)

    @property
    def current_height(self) -> float:
        """Get the current height."""
        return self._current_height

    @property
    def device_info(self) -> Mapping[str, str]:
        """

        Returns: a dict
            { 'serial': 'abc123', 'model': '8675309', 'version': '9001' }

        """
        return self._device_info

    @property
    def status(self) -> types.MagneticStatus:
        if self.current_height > 0:
            return types.MagneticStatus.ENGAGED
        else:
            return types.MagneticStatus.DISENGAGED

    @property
    def engaged(self) -> bool:
        if self.current_height > 0:
            return True
        else:
            return False

    @property
    def live_data(self) -> types.LiveData:
        return {
            "status": self.status,
            "data": {"engaged": self.engaged, "height": self.current_height},
        }

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    # Internal Methods

    async def prep_for_update(self) -> str:
        await self._driver.enter_programming_mode()
        new_port = await update.find_bootloader_port()
        return new_port or self.port

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        if not revision or "v" not in revision:
            log.error(f"bad revision: {revision}")
            return "magneticModuleV1"
        try:
            revision_num = float(revision.split("v")[-1])
        except (ValueError, TypeError):
            log.exception("bad revision: {revision}")
            return "magneticModuleV1"
        if revision_num < MagDeck.FIRST_GEN2_REVISION:
            return "magneticModuleV1"
        else:
            return "magneticModuleV2"
