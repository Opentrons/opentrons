from __future__ import annotations
import asyncio
import copy
import logging
from threading import Event
from typing import Dict, Optional, List, Tuple, TYPE_CHECKING, Sequence, Iterator, cast
from contextlib import contextmanager

from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    mutable_configurations,
    pipette_definition,
)

from opentrons import types
from opentrons.config.types import RobotConfig
from opentrons.config import get_opentrons_path
from opentrons.drivers.smoothie_drivers import SimulatingDriver

from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.util.async_helpers import ensure_yield

from .. import modules
from ..types import BoardRevision, Axis
from ..module_control import AttachedModulesControl
from ..util import ot2_axis_to_string

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.types import PipetteName, PipetteModel
    from ..dev_types import (
        AttachedPipette,
        AttachedInstruments,
        PipetteSpec,
        InstrumentHardwareConfigs,
    )
    from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike


MODULE_LOG = logging.getLogger(__name__)


class Simulator:
    """This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """

    @classmethod
    async def build(
        cls,
        attached_instruments: Dict[types.Mount, Dict[str, Optional[str]]],
        attached_modules: Dict[str, List[modules.SimulatingModule]],
        config: RobotConfig,
        loop: asyncio.AbstractEventLoop,
        strict_attached_instruments: bool = True,
    ) -> Simulator:
        """Build the simulator.

        Use this factory method rather than the initializer to handle proper GPIO
        initialization.

        :param attached_instruments: A dictionary describing the instruments
                                     the simulator should consider attached.
                                     If this argument is specified and
                                     :py:meth:`get_attached_instruments` is
                                     called with expectations that do not
                                     match, the call fails. This is useful for
                                     making the simulator match the real
                                     hardware, for instance to check if a
                                     protocol asks for the right instruments.
                                     This dict should map mounts to either
                                     empty dicts or to dicts containing
                                     'model' and 'id' keys.
        :param attached_modules: A map of module type names (e.g.
                                 `'tempdeck'` or `'magdeck'`) to lists of SimulatingModel
                                 dataclasses representing
                                 modules the simulator should assume are
                                 attached. Like `attached_instruments`, used
                                 to make the simulator match the setup of the
                                 real hardware.
        :param config: The robot config to use
        :param loop: The asyncio event loop to use.
        :param strict_attached_instruments: This param changes the behavior of
                                            the instrument cache. If ``True``,
                                            (default), ``cache_instrument``
                                            calls requesting instruments not
                                            in ``attached_instruments`` will
                                            fail as if the instrument was not
                                            present. If ``False``, those calls
                                            will still pass but give a response
                                            version of 1, while calls
                                            requesting instruments that _are_
                                            present get the full number.
        """
        gpio = SimulatingGPIOCharDev("gpiochip0")
        await gpio.setup()
        return cls(
            attached_instruments,
            attached_modules,
            config,
            loop,
            gpio,
            strict_attached_instruments,
        )

    def __init__(
        self,
        attached_instruments: Dict[types.Mount, Dict[str, Optional[str]]],
        attached_modules: Dict[str, List[modules.SimulatingModule]],
        config: RobotConfig,
        loop: asyncio.AbstractEventLoop,
        gpio_chardev: GPIODriverLike,
        strict_attached_instruments: bool = True,
    ) -> None:
        """Initialize the simulator.

        Always prefer using :py:meth:`.build` to create an instance of this class. For
        more information on arguments, see that method. If you want to use this
        directly, you must pass in an initialized _and set up_ GPIO driver instance.
        """
        self.config = config
        self._loop = loop
        self._smoothie_driver = SimulatingDriver()
        self._gpio_chardev = gpio_chardev

        def _sanitize_attached_instrument(
            passed_ai: Optional[PipetteSpec] = None,
        ) -> PipetteSpec:
            if not passed_ai or not passed_ai.get("model"):
                return {"model": None, "id": None}
            if pipette_load_name.supported_pipette(
                cast("PipetteName", passed_ai["model"])
            ):
                if pipette_load_name.is_model(passed_ai["model"]):
                    return passed_ai
                else:
                    get_pip_model = pipette_load_name.convert_pipette_name(
                        cast("PipetteName", passed_ai["model"])
                    )
                    return {
                        "model": PipetteModel(str(get_pip_model)),
                        "id": passed_ai.get("id"),
                    }
            raise KeyError(
                "If you specify attached_instruments, the model "
                "should be pipette names or pipette models, but "
                f'{passed_ai["model"]} is not'
            )

        self._attached_instruments = {
            m: _sanitize_attached_instrument(attached_instruments.get(m))  # type: ignore
            for m in types.Mount.ot2_mounts()
        }
        self._stubbed_attached_modules = attached_modules
        self._position = copy.copy(self._smoothie_driver.homed_position)
        # Engaged axes start all true in smoothie for some reason so we
        # imitate that here
        # TODO(LC2642019) Create a simulating driver for smoothie instead of
        # using a flag

        self._engaged_axes = {ax: True for ax in self._smoothie_driver.homed_position}
        self._lights = {"button": False, "rails": False}
        self._run_flag = Event()
        self._run_flag.set()
        self._log = MODULE_LOG.getChild(repr(self))
        self._strict_attached = bool(strict_attached_instruments)
        self._board_revision = BoardRevision.OG
        # TODO (lc 05-12-2021) In a follow-up refactor that pulls the execution
        # manager responsbility into the controller/backend itself as opposed
        # to the hardware api controller.
        self._module_controls: Optional[AttachedModulesControl] = None

    async def get_serial_number(self) -> Optional[str]:
        return "simulator"

    @property
    def gpio_chardev(self) -> GPIODriverLike:
        return self._gpio_chardev

    @property
    def module_controls(self) -> AttachedModulesControl:
        if not self._module_controls:
            raise AttributeError("Module controls not found.")
        return self._module_controls

    @module_controls.setter
    def module_controls(self, module_controls: AttachedModulesControl) -> None:
        self._module_controls = module_controls

    @ensure_yield
    async def update_position(self) -> Dict[str, float]:
        return self._position

    def _unhomed_axes(self, axes: Sequence[str]) -> List[str]:
        return list(
            axis
            for axis in axes
            if not self._smoothie_driver.homed_flags.get(axis, False)
        )

    def is_homed(self, axes: Sequence[str]) -> bool:
        return not any(self._unhomed_axes(axes))

    @ensure_yield
    async def move(
        self,
        target_position: Dict[str, float],
        home_flagged_axes: bool = True,
        speed: Optional[float] = None,
        axis_max_speeds: Optional[Dict[str, float]] = None,
    ) -> None:
        self._position.update(target_position)
        self._engaged_axes.update({ax: True for ax in target_position})

    @ensure_yield
    async def home(self, axes: Optional[List[str]] = None) -> Dict[str, float]:
        # driver_3_0-> HOMED_POSITION
        checked_axes = "".join(axes) if axes else "XYZABC"
        self._position.update(
            {ax: self._smoothie_driver.homed_position[ax] for ax in checked_axes}
        )
        self._engaged_axes.update({ax: True for ax in checked_axes})
        await self._smoothie_driver.home(axis=checked_axes)
        return self._position

    @ensure_yield
    async def fast_home(self, axis: Sequence[str], margin: float) -> Dict[str, float]:
        for ax in axis:
            self._position[ax] = self._smoothie_driver.homed_position[ax]
            self._engaged_axes[ax] = True
        return self._position

    def _attached_to_mount(
        self, mount: types.Mount, expected_instr: Optional["PipetteName"]
    ) -> AttachedPipette:
        init_instr = self._attached_instruments.get(mount, {"model": None, "id": None})
        found_model = init_instr["model"]
        back_compat: List["PipetteName"] = []

        path_to_overrides = get_opentrons_path("pipette_config_overrides_dir")
        found_model_configs: Optional[pipette_definition.PipetteConfigurations] = None

        converted_found_name: Optional[pipette_definition.PipetteNameType] = None
        if found_model:
            converted_found_model = pipette_load_name.convert_pipette_model(found_model)
            converted_found_name = pipette_load_name.convert_to_pipette_name_type(
                found_model
            )
            found_model_configs = (
                mutable_configurations.load_with_mutable_configurations(
                    converted_found_model, path_to_overrides, init_instr["id"]
                )
            )
            back_compat = found_model_configs.pipette_backcompat_names
        if (
            expected_instr
            and found_model
            and found_model_configs
            and (
                str(converted_found_name) != expected_instr
                and expected_instr not in back_compat
            )
        ):
            if self._strict_attached:
                raise RuntimeError(
                    "mount {}: expected instrument {} but got {}".format(
                        mount.name, expected_instr, found_model
                    )
                )
            else:
                converted_expected_model = pipette_load_name.convert_pipette_name(
                    expected_instr
                )
                return {
                    "config": mutable_configurations.load_with_mutable_configurations(
                        converted_expected_model, path_to_overrides
                    ),
                    "id": None,
                }
        elif found_model and found_model_configs:
            # Instrument detected matches instrument expected (note:
            # "instrument detected" means passed as an argument to the
            # constructor of this class) OR,
            # Instrument detected and no expected instrument specified
            return {
                "config": found_model_configs,
                "id": init_instr["id"],
            }
        elif expected_instr:
            # Expected instrument specified and no instrument detected
            converted_expected_model = pipette_load_name.convert_pipette_name(
                expected_instr
            )
            return {
                "config": mutable_configurations.load_with_mutable_configurations(
                    converted_expected_model, path_to_overrides
                ),
                "id": None,
            }
        else:
            # No instrument detected or expected
            return {"config": None, "id": None}

    @ensure_yield
    async def get_attached_instruments(
        self, expected: Dict[types.Mount, "PipetteName"]
    ) -> AttachedInstruments:
        """Update the internal cache of attached instruments.

        This method allows after-init-time specification of attached simulated
        instruments. The method will return
        - the instruments specified at init-time, or if those do not exists,
        - the instruments specified in expected, or if that is not passed,
        - nothing

        :param expected: A mapping of mount to instrument model prefixes. When
                         loading instruments from a prefix, we return the
                         lexically-first model that matches the prefix. If the
                         models specified in expected do not match the models
                         specified in the `attached_instruments` argument of
                         :py:meth:`__init__`, :py:attr:`RuntimeError` is
                         raised.
        :raises RuntimeError: If an instrument is expected but not found.
        :returns: A dict of mount to either instrument model names or `None`.
        """
        return {
            mount: self._attached_to_mount(mount, expected.get(mount))
            for mount in types.Mount.ot2_mounts()
        }

    def set_active_current(self, axis_currents: Dict[Axis, float]) -> None:
        pass

    @ensure_yield
    async def watch(self) -> None:
        new_mods_at_ports = []
        for mod_name, list_of_modules in self._stubbed_attached_modules.items():
            for module_details in list_of_modules:
                new_mods_at_ports.append(
                    modules.SimulatingModuleAtPort(
                        port=f"/dev/ot_module_sim_{mod_name}{str(module_details.serial_number)}",
                        name=mod_name,
                        serial_number=module_details.serial_number,
                        model=module_details.model,
                    )
                )
        await self.module_controls.register_modules(new_mods_at_ports=new_mods_at_ports)

    @contextmanager
    def save_current(self) -> Iterator[None]:
        yield

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
        return "Virtual Smoothie"

    @ensure_yield
    async def update_fw_version(self) -> None:
        pass

    @property
    def board_revision(self) -> BoardRevision:
        return self._board_revision

    @ensure_yield
    async def update_firmware(
        self, filename: str, loop: asyncio.AbstractEventLoop, modeset: bool
    ) -> str:
        return "Did nothing (simulating)"

    def engaged_axes(self) -> Dict[str, bool]:
        return self._engaged_axes

    @ensure_yield
    async def disengage_axes(self, axes: List[str]) -> None:
        self._engaged_axes.update({ax: False for ax in axes})

    def set_lights(self, button: Optional[bool], rails: Optional[bool]) -> None:
        if button is not None:
            self._lights["button"] = button
        if rails is not None:
            self._lights["rails"] = rails

    def get_lights(self) -> Dict[str, bool]:
        return self._lights

    def pause(self) -> None:
        self._run_flag.clear()

    def resume(self) -> None:
        self._run_flag.set()

    @ensure_yield
    async def halt(self) -> None:
        self._run_flag.set()

    @ensure_yield
    async def hard_halt(self) -> None:
        self._run_flag.set()

    @ensure_yield
    async def probe(self, axis: str, distance: float) -> Dict[str, float]:
        self._position[axis.upper()] = self._position[axis.upper()] + distance
        return self._position

    @ensure_yield
    async def clean_up(self) -> None:
        pass

    @ensure_yield
    async def configure_mount(
        self, mount: types.Mount, config: InstrumentHardwareConfigs
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
