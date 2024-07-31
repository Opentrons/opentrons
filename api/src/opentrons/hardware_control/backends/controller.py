from __future__ import annotations
import asyncio
from contextlib import contextmanager, AsyncExitStack
import logging
from typing import (
    Callable,
    Iterator,
    Any,
    Dict,
    List,
    Optional,
    Tuple,
    TYPE_CHECKING,
    Union,
    Sequence,
    cast,
)
from typing_extensions import Final
from pathlib import Path

try:
    import aionotify  # type: ignore[import-untyped]
except (OSError, ModuleNotFoundError):
    aionotify = None

from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    mutable_configurations,
)
from opentrons_shared_data.pipette.types import PipetteName

from opentrons.drivers.smoothie_drivers import SmoothieDriver
from opentrons.drivers.rpi_drivers import build_gpio_chardev
import opentrons.config
from opentrons.config.types import RobotConfig
from opentrons.types import Mount

from ..module_control import AttachedModulesControl
from ..types import AionotifyEvent, BoardRevision, Axis, DoorState
from ..util import ot2_axis_to_string

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.types import PipetteModel
    from ..dev_types import (
        AttachedPipette,
        AttachedInstruments,
        InstrumentHardwareConfigs,
    )
    from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike

MODULE_LOG = logging.getLogger(__name__)


class Controller:
    """The concrete instance of the controller for actually controlling
    hardware.
    """

    @classmethod
    async def build(cls, config: Optional[RobotConfig]) -> Controller:
        """Build a Controller instance.

        Use this factory method rather than the initializer to handle proper
        GPIO initialization.

        :param config: A loaded robot config.
        """

        gpio = build_gpio_chardev("gpiochip0")
        gpio.config_by_board_rev()
        await gpio.setup()
        return cls(config, gpio)

    def __init__(self, config: Optional[RobotConfig], gpio: GPIODriverLike):
        """Build a Controller instance.

        Always prefer using :py:meth:`.build` to create an instance of this class. For
        more information on arguments, see that method. If you want to use this
        directly, you must pass in an initialized _and set up_ GPIO driver instance.
        """
        if not opentrons.config.IS_ROBOT:
            MODULE_LOG.warning(
                "This is intended to run on a robot, and while it can connect "
                "to a smoothie via a usb/serial adapter unexpected things "
                "using gpios (such as smoothie reset or light management) "
                "will fail. If you are seeing this message and you are "
                "running on a robot, you need to set the RUNNING_ON_PI "
                "environmental variable to 1."
            )

        self.config = config or opentrons.config.robot_configs.load_ot2()

        self._gpio_chardev: Final = gpio
        self._board_revision: Final = self.gpio_chardev.board_rev
        # We handle our own locks in the hardware controller thank you
        self._smoothie_driver = SmoothieDriver(
            config=self.config, gpio_chardev=self._gpio_chardev
        )
        self._cached_fw_version: Optional[str] = None
        self._module_controls: Optional[AttachedModulesControl] = None
        try:
            self._event_watcher = self._build_event_watcher()
        except AttributeError:
            MODULE_LOG.warning(
                "Failed to initiate aionotify, cannot watch modules "
                "or door, likely because not running on linux"
            )

    @staticmethod
    def _build_event_watcher() -> aionotify.Watcher:
        watcher = aionotify.Watcher()
        watcher.watch(
            alias="modules",
            path="/dev",
            flags=(
                aionotify.Flags.CREATE
                | aionotify.Flags.DELETE
                | aionotify.Flags.MOVED_FROM
                | aionotify.Flags.MOVED_TO
            ),
        )
        return watcher

    @property
    def gpio_chardev(self) -> GPIODriverLike:
        return self._gpio_chardev

    @property
    def board_revision(self) -> BoardRevision:
        return self._board_revision

    @property
    def module_controls(self) -> AttachedModulesControl:
        if not self._module_controls:
            raise AttributeError("Module controls not found.")
        return self._module_controls

    @module_controls.setter
    def module_controls(self, module_controls: AttachedModulesControl) -> None:
        self._module_controls = module_controls

    async def get_serial_number(self) -> Optional[str]:
        try:
            return Path("/var/serial").read_text().strip()
        except OSError:
            return None

    def start_gpio_door_watcher(
        self,
        loop: asyncio.AbstractEventLoop,
        update_door_state: Callable[[DoorState], None],
    ) -> None:
        self.gpio_chardev.start_door_switch_watcher(
            loop=loop, update_door_state=update_door_state
        )

    async def update_position(self) -> Dict[str, float]:
        await self._smoothie_driver.update_position()
        return self._smoothie_driver.position

    def _unhomed_axes(self, axes: Sequence[str]) -> List[str]:
        return list(
            axis
            for axis in axes
            if not self._smoothie_driver.homed_flags.get(axis, False)
        )

    def is_homed(self, axes: Sequence[str]) -> bool:
        return not any(self._unhomed_axes(axes))

    async def move(
        self,
        target_position: Dict[str, float],
        home_flagged_axes: bool = True,
        speed: Optional[float] = None,
        axis_max_speeds: Optional[Dict[str, float]] = None,
    ) -> None:
        async with AsyncExitStack() as cmstack:
            if axis_max_speeds:
                await cmstack.enter_async_context(
                    self._smoothie_driver.restore_axis_max_speed(axis_max_speeds)
                )
            await self._smoothie_driver.move(
                target_position, home_flagged_axes=home_flagged_axes, speed=speed
            )

    async def home(self, axes: Optional[List[str]] = None) -> Dict[str, float]:
        if axes:
            args: Tuple[Any, ...] = ("".join(axes),)
        else:
            args = tuple()
        return await self._smoothie_driver.home(*args)

    async def fast_home(self, axes: Sequence[str], margin: float) -> Dict[str, float]:
        converted_axes = "".join(axes)
        return await self._smoothie_driver.fast_home(converted_axes, margin)

    async def _query_mount(
        self, mount: Mount, expected: Union[PipetteModel, PipetteName, None]
    ) -> AttachedPipette:
        found_model: Optional[
            PipetteModel
        ] = await self._smoothie_driver.read_pipette_model(  # type: ignore
            mount.name.lower()
        )
        if found_model and not pipette_load_name.supported_pipette(found_model):
            # TODO: Consider how to handle this error - it bubbles up now
            # and will cause problems at higher levels
            MODULE_LOG.error(f"Bad model on {mount.name}: {found_model}")
            found_model = None
        found_id = await self._smoothie_driver.read_pipette_id(mount.name.lower())

        if found_model:
            path_to_overrides = opentrons.config.get_opentrons_path(
                "pipette_config_overrides_dir"
            )
            converted_found_model = pipette_load_name.convert_pipette_model(found_model)
            converted_found_name = pipette_load_name.convert_to_pipette_name_type(
                found_model
            )
            config = mutable_configurations.load_with_mutable_configurations(
                converted_found_model, path_to_overrides, found_id
            )
            if expected:
                acceptable = [
                    cast(PipetteName, str(converted_found_name))
                ] + config.pipette_backcompat_names
                if expected not in acceptable:
                    raise RuntimeError(
                        f"mount {mount}: instrument"
                        f" {expected} was requested"
                        f" but {converted_found_model} is present"
                    )
            return {"config": config, "id": found_id}
        else:
            if expected:
                raise RuntimeError(
                    f"mount {mount}: instrument {expected} was"
                    f" requested, but no instrument is present"
                )
            return {"config": None, "id": None}

    async def get_attached_instruments(
        self, expected: Dict[Mount, PipetteName]
    ) -> AttachedInstruments:
        """Find the instruments attached to our mounts.
        :param expected: is ignored, it is just meant to enforce
                          the same interface as the simulator, where
                          required instruments can be manipulated.

        :returns: A dict with mounts as the top-level keys. Each mount value is
            a dict with keys 'model' (containing an instrument model name or
            `None`) and 'id' (containing the serial number of the pipette
            attached to that mount, or `None`). Both mounts will always be
            specified.
        """
        return {
            mount: await self._query_mount(mount, expected.get(mount))
            for mount in Mount.ot2_mounts()
        }

    def set_active_current(self, axis_currents: Dict[Axis, float]) -> None:
        """
        This method sets only the 'active' current, i.e., the current for an
        axis' movement. Smoothie driver automatically resets the current for
        pipette axis to a low current (dwelling current) after each move
        """
        self._smoothie_driver.set_active_current(
            {ot2_axis_to_string(axis): amp for axis, amp in axis_currents.items()}
        )

    @contextmanager
    def save_current(self) -> Iterator[None]:
        self._smoothie_driver.push_active_current()
        try:
            yield
        finally:
            self._smoothie_driver.pop_active_current()

    async def _handle_watch_event(self) -> None:
        try:
            event = await self._event_watcher.get_event()
        except asyncio.IncompleteReadError:
            MODULE_LOG.debug("incomplete read error when quitting watcher")
            return
        if event is not None:
            if "ot_module" in event.name:
                event_name = event.name
                flags = aionotify.Flags.parse(event.flags)
                event_description = AionotifyEvent.build(event_name, flags)
                await self.module_controls.handle_module_appearance(event_description)

    async def watch(self, loop: asyncio.AbstractEventLoop) -> None:
        can_watch = aionotify is not None
        if can_watch:
            await self._event_watcher.setup(loop)

        while can_watch and (not self._event_watcher.closed):
            await self._handle_watch_event()

    async def connect(self, port: Optional[str] = None) -> None:
        """Build driver and connect to it."""
        await self._smoothie_driver.connect(port)
        await self.update_fw_version()

    @property
    def axis_bounds(self) -> Dict[Axis, Tuple[float, float]]:
        """The (minimum, maximum) bounds for each axis."""
        return {
            Axis[ax]: (0, pos)
            for ax, pos in self._smoothie_driver.axis_bounds.items()
            if ax not in "BC"
        }

    @property
    def fw_version(self) -> Optional[str]:
        return self._cached_fw_version

    async def update_fw_version(self) -> None:
        self._cached_fw_version = await self._smoothie_driver.get_fw_version()

    async def update_firmware(
        self, filename: str, loop: asyncio.AbstractEventLoop, modeset: bool
    ) -> str:
        msg = await self._smoothie_driver.update_firmware(filename, loop, modeset)
        await self.update_fw_version()
        return msg

    def engaged_axes(self) -> Dict[str, bool]:
        return self._smoothie_driver.engaged_axes

    async def disengage_axes(self, axes: List[str]) -> None:
        await self._smoothie_driver.disengage_axis("".join(axes))

    def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        if button is not None:
            self.gpio_chardev.set_button_light(blue=button)
        if rails is not None:
            self.gpio_chardev.set_rail_lights(rails)

    def get_lights(self) -> Dict[str, bool]:
        return {
            "button": self.gpio_chardev.get_button_light()[2],
            "rails": self.gpio_chardev.get_rail_lights(),
        }

    def pause(self) -> None:
        self._smoothie_driver.pause()

    def resume(self) -> None:
        self._smoothie_driver.resume()

    async def halt(self) -> None:
        await self._smoothie_driver.kill()

    async def hard_halt(self) -> None:
        await self._smoothie_driver.hard_halt()

    async def probe(self, axis: str, distance: float) -> Dict[str, float]:
        """Run a probe and return the new position dict"""
        return await self._smoothie_driver.probe_axis(axis, distance)

    async def clean_up(self) -> None:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            return
        if hasattr(self, "_event_watcher"):
            if loop.is_running() and self._event_watcher:
                self._event_watcher.close()
        if hasattr(self, "gpio_chardev"):
            try:
                if not loop.is_closed():
                    self.gpio_chardev.stop_door_switch_watcher(loop)
            except RuntimeError:
                pass

    async def configure_mount(
        self, mount: Mount, config: InstrumentHardwareConfigs
    ) -> None:
        mount_axis = Axis.by_mount(mount)
        plunger_axis = Axis.of_plunger(mount)

        await self._smoothie_driver.update_steps_per_mm(
            {ot2_axis_to_string(plunger_axis): config["steps_per_mm"]}
        )
        await self._smoothie_driver.update_pipette_config(
            ot2_axis_to_string(mount_axis), {"home": config["home_pos"]}
        )
        await self._smoothie_driver.update_pipette_config(
            ot2_axis_to_string(plunger_axis), {"max_travel": config["max_travel"]}
        )
        self._smoothie_driver.set_dwelling_current(
            {ot2_axis_to_string(plunger_axis): config["idle_current"]}
        )
        ms = config["splits"]
        if ms:
            self._smoothie_driver.configure_splits_for(
                {ot2_axis_to_string(plunger_axis): ms}
            )
