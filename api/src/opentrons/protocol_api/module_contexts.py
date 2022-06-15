from __future__ import annotations

import asyncio
import logging
from typing import Generic, List, Optional, TYPE_CHECKING, TypeVar, cast

from opentrons import types
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import modules
from opentrons.hardware_control.modules import ModuleModel, types as module_types
from opentrons.hardware_control.types import Axis
from opentrons.commands import module_commands as cmds
from opentrons.commands.publisher import CommandPublisher, publish
from opentrons.protocols.api_support.types import APIVersion

from .module_validation_and_errors import (
    validate_heater_shaker_temperature,
    validate_heater_shaker_speed,
)
from .labware import Labware, load, load_from_definition
from .load_info import LabwareLoadInfo
from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)
from opentrons.protocols.api_support.util import requires_version

if TYPE_CHECKING:
    from .protocol_context import ProtocolContext
    from opentrons_shared_data.labware.dev_types import LabwareDefinition

ENGAGE_HEIGHT_UNIT_CNV = 2
MAGDECK_HALF_MM_LABWARE = [
    # Load names of labware whose definitions accidentally specify an engage height
    # in units of half-millimeters, instead of millimeters.
    "biorad_96_wellplate_200ul_pcr",
    "nest_96_wellplate_100ul_pcr_full_skirt",
    "usascientific_96_wellplate_2.4ml_deep",
]

MODULE_LOG = logging.getLogger(__name__)

GeometryType = TypeVar("GeometryType", bound=ModuleGeometry)


class NoTargetTemperatureSetError(RuntimeError):
    """An error raised when awaiting temperature when no target was set."""


class CannotPerformModuleAction(RuntimeError):
    """An error raised when attempting to execute an invalid module action."""


class ModuleContext(CommandPublisher, Generic[GeometryType]):
    """An object representing a connected module.

    .. versionadded:: 2.0
    """

    def __init__(
        self,
        ctx: ProtocolContext,
        geometry: GeometryType,
        requested_as: ModuleModel,
        at_version: APIVersion,
    ) -> None:
        """Build the ModuleContext.

        This usually should not be instantiated directly; instead, modules
        should be loaded using :py:meth:`ProtocolContext.load_module`.

        :param ctx: The parent context for the module
        :param geometry: The :py:class:`.ModuleGeometry` for the module
        :param requested_as: See :py:obj:`requested_as`.
        """
        super().__init__(ctx.broker)
        self._geometry = geometry
        self._ctx = ctx
        self._requested_as = requested_as
        self._api_version = at_version

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @requires_version(2, 0)
    def load_labware_object(self, labware: Labware) -> Labware:
        """Specify the presence of a piece of labware on the module.

        :param labware: The labware object. This object should be already
                        initialized and its parent should be set to this
                        module's geometry. To initialize and load a labware
                        onto the module in one step, see
                        :py:meth:`load_labware`.
        :returns: The properly-linked labware object
        """
        mod_labware = self._geometry.add_labware(labware)
        labware_namespace, labware_load_name, labware_version = labware.uri.split("/")
        module_loc = self._geometry.parent

        assert isinstance(module_loc, (int, str)), "Unexpected labware object parent"
        deck_slot = types.DeckSlotName.from_primitive(module_loc)

        provided_offset = self._ctx._labware_offset_provider.find(
            labware_definition_uri=labware.uri,
            requested_module_model=self.requested_as,
            deck_slot=deck_slot,
        )

        labware.set_calibration(provided_offset.delta)
        self._ctx._implementation.get_deck().recalculate_high_z()

        self._ctx.equipment_broker.publish(
            LabwareLoadInfo(
                labware_definition=labware._implementation.get_definition(),
                labware_namespace=labware_namespace,
                labware_load_name=labware_load_name,
                labware_version=int(labware_version),
                deck_slot=deck_slot,
                on_module=True,
                offset_id=provided_offset.offset_id,
                labware_display_name=labware._implementation.get_label(),
            )
        )
        return mod_labware

    @requires_version(2, 0)
    def load_labware(
        self,
        name: str,
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: int = 1,
    ) -> Labware:
        """Specify the presence of a piece of labware on the module.

        :param name: The name of the labware object.
        :param str label: An optional special name to give the labware. If
            specified, this is the name the labware will appear as in the run
            log and the calibration view in the Opentrons app.
        :param str namespace: The namespace the labware definition belongs to.
            If unspecified, will search 'opentrons' then 'custom_beta'
        :param int version: The version of the labware definition. If
            unspecified, will use version 1.

        :returns: The initialized and loaded labware object.

        .. versionadded:: 2.1
            The *label,* *namespace,* and *version* parameters.
        """
        if self.api_version < APIVersion(2, 1) and (label or namespace or version):
            MODULE_LOG.warning(
                f"You have specified API {self.api_version}, but you "
                "are trying to utilize new load_labware parameters in 2.1"
            )
        lw = load(
            name,
            self._geometry.location,
            label,
            namespace,
            version,
            bundled_defs=self._ctx._implementation.get_bundled_labware(),
            extra_defs=self._ctx._implementation.get_extra_labware(),
        )
        return self.load_labware_object(lw)

    @requires_version(2, 0)
    def load_labware_from_definition(
        self, definition: LabwareDefinition, label: Optional[str] = None
    ) -> Labware:
        """
        Specify the presence of a labware on the module, using an
        inline definition.

        :param definition: The labware definition.
        :param str label: An optional special name to give the labware. If
                          specified, this is the name the labware will appear
                          as in the run log and the calibration view in the
                          Opentrons app.
        :returns: The initialized and loaded labware object.
        """
        lw = load_from_definition(definition, self._geometry.location, label)
        return self.load_labware_object(lw)

    @requires_version(2, 1)
    def load_labware_by_name(
        self,
        name: str,
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: int = 1,
    ) -> Labware:
        """
        .. deprecated:: 2.0
            Use :py:meth:`load_labware` instead.
        """
        MODULE_LOG.warning(
            "load_labware_by_name is deprecated. Use load_labware instead."
        )
        return self.load_labware(name, label, namespace, version)

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def labware(self) -> Optional[Labware]:
        """The labware (if any) present on this module."""
        return self._geometry.labware

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def geometry(self) -> ModuleGeometry:
        """The object representing the module as an item on the deck

        :returns: ModuleGeometry
        """
        return self._geometry

    @property
    def requested_as(self) -> ModuleModel:
        """How the protocol requested this module.

        For example, a physical ``temperatureModuleV2`` might have been requested
        either as ``temperatureModuleV2`` or ``temperatureModuleV1``.

        For Opentrons internal use only.

        :meta private:
        """
        return self._requested_as

    def __repr__(self) -> str:
        return "{} at {} lw {}".format(
            self.__class__.__name__, self._geometry, self.labware
        )


class TemperatureModuleContext(ModuleContext[ModuleGeometry]):
    """An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module` using:
    ``ctx.load_module('Temperature Module', slot_number)``.

    A minimal protocol with a Temperature module would look like this:

    .. code-block:: python

        def run(ctx):
            slot_number = 10
            temp_mod = ctx.load_module('Temperature Module', slot_number)
            temp_plate = temp_mod.load_labware(
                'biorad_96_wellplate_200ul_pcr')

            temp_mod.set_temperature(45.5)
            temp_mod.deactivate()

    .. note::

        In order to prevent physical obstruction of other slots, place the
        Temperature Module in a slot on the horizontal edges of the deck (such
        as 1, 4, 7, or 10 on the left or 3, 6, or 7 on the right), with the USB
        cable and power cord pointing away from the deck.


    .. versionadded:: 2.0

    """

    def __init__(
        self,
        ctx: ProtocolContext,
        # TODO(mc, 2022-02-05): this type annotation is misleading;
        # a SynchronousAdapter wrapper is actually passed in
        hw_module: modules.tempdeck.TempDeck,
        geometry: ModuleGeometry,
        requested_as: ModuleModel,
        at_version: APIVersion,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, requested_as, at_version)

    @publish(command=cmds.tempdeck_set_temp)
    @requires_version(2, 0)
    def set_temperature(self, celsius: float) -> None:
        """Set the target temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        self._module.set_temperature(celsius)

    @publish(command=cmds.tempdeck_set_temp)
    @requires_version(2, 3)
    def start_set_temperature(self, celsius: float) -> None:
        """Start setting the target temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        self._module.start_set_temperature(celsius)

    @publish(command=cmds.tempdeck_await_temp)
    @requires_version(2, 3)
    def await_temperature(self, celsius: float) -> None:
        """Wait until module reaches temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        self._module.await_temperature(celsius)

    @publish(command=cmds.tempdeck_deactivate)
    @requires_version(2, 0)
    def deactivate(self) -> None:
        """Stop heating (or cooling) and turn off the fan."""
        self._module.deactivate()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def temperature(self) -> float:
        """Current temperature in C"""
        return self._module.temperature

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def target(self) -> Optional[float]:
        """Current target temperature in C"""
        return self._module.target

    @property  # type: ignore[misc]
    @requires_version(2, 3)
    def status(self) -> str:
        """The status of the module.

        Returns 'holding at target', 'cooling', 'heating', or 'idle'

        """
        return self._module.status


class MagneticModuleContext(ModuleContext[ModuleGeometry]):
    """An object representing a connected Magnetic Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0

    """

    def __init__(
        self,
        ctx: ProtocolContext,
        # TODO(mc, 2022-02-05): this type annotation is misleading;
        # a SynchronousAdapter wrapper is actually passed in
        hw_module: modules.magdeck.MagDeck,
        geometry: ModuleGeometry,
        requested_as: ModuleModel,
        at_version: APIVersion,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, requested_as, at_version)

    @publish(command=cmds.magdeck_calibrate)
    @requires_version(2, 0)
    def calibrate(self) -> None:
        """Calibrate the Magnetic Module.

        The calibration is used to establish the position of the labware on
        top of the magnetic module.
        """
        self._module.calibrate()

    @requires_version(2, 0)
    def load_labware_object(self, labware: Labware) -> Labware:
        """
        Load labware onto a Magnetic Module, checking if it is compatible
        """
        if labware.magdeck_engage_height is None:
            MODULE_LOG.warning(
                "This labware ({}) is not explicitly compatible with the"
                " Magnetic Module. You will have to specify a height when"
                " calling engage()."
            )
        return super().load_labware_object(labware)

    @publish(command=cmds.magdeck_engage)
    @requires_version(2, 0)
    def engage(
        self,
        height: Optional[float] = None,
        offset: Optional[float] = None,
        height_from_base: Optional[float] = None,
    ) -> None:
        """Raise the Magnetic Module's magnets.

        You can specify how high the magnets should go in several different ways:

           - If you specify ``height_from_base``, it's measured relative to the bottom
             of the labware.

             This is the recommended way to adjust the magnets' height.

           - If you specify ``height``, it's measured relative to the magnets'
             home position.

             You should normally use ``height_from_base`` instead.

           - If you specify nothing,
             the magnets will rise to a reasonable default height
             based on what labware you've loaded on this Magnetic Module.

             Only certain labware have a defined engage height.
             If you've loaded a labware that doesn't,
             or if you haven't loaded any labware, then you'll need to specify
             a height yourself with ``height`` or ``height_from_base``.
             Otherwise, an exception will be raised.

           - If you specify ``offset``,
             it's measured relative to the default height, as described above.
             A positive number moves the magnets higher and
             a negative number moves the magnets lower.

        The units of ``height_from_base``, ``height``, and ``offset``
        depend on which generation of Magnetic Module you're using:

           - For GEN1 Magnetic Modules, they're in *half-millimeters,*
             for historical reasons. This will not be the case in future
             releases of the Python Protocol API.
           - For GEN2 Magnetic Modules, they're in true millimeters.

        You may not specify more than one of
        ``height_from_base``, ``height``, and ``offset``.

        .. versionadded:: 2.2
            The *height_from_base* parameter.
        """
        if height is not None:
            dist = height

        # This version check has a bug:
        # if the caller sets height_from_base in an API version that's too low,
        # we will silently ignore it instead of raising APIVersionError.
        # Leaving this unfixed because we haven't thought through
        # how to do backwards-compatible fixes to our version checking itself.
        elif height_from_base is not None and self._ctx._api_version >= APIVersion(
            2, 2
        ):
            dist = (
                height_from_base
                + modules.magdeck.OFFSET_TO_LABWARE_BOTTOM[self._module.model()]
            )

        elif self.labware and self.labware.magdeck_engage_height is not None:
            dist = self._determine_lw_engage_height()
            if offset:
                dist += offset

        else:
            raise ValueError(
                "Currently loaded labware {} does not have a known engage "
                "height; please specify explicitly with the height param".format(
                    self.labware
                )
            )

        self._module.engage(dist)

    def _determine_lw_engage_height(self) -> float:
        """Return engage height based on Protocol API and module versions

        For API Version 2.3 or later:
           - Multiply non-standard labware engage heights by 2 for gen1 modules
           - Divide standard labware engage heights by 2 for gen2 modules
        If none of the above, return the labware engage heights as defined in
        the labware definitions
        """
        assert self.labware
        assert self.labware.magdeck_engage_height

        engage_height = self.labware.magdeck_engage_height

        is_api_breakpoint = self._ctx._api_version >= APIVersion(2, 3)
        is_v1_module = self._module.model() == "magneticModuleV1"
        engage_height_is_in_half_mm = self.labware.load_name in MAGDECK_HALF_MM_LABWARE

        if is_api_breakpoint and is_v1_module and not engage_height_is_in_half_mm:
            return engage_height * ENGAGE_HEIGHT_UNIT_CNV
        elif is_api_breakpoint and not is_v1_module and engage_height_is_in_half_mm:
            return engage_height / ENGAGE_HEIGHT_UNIT_CNV
        else:
            return engage_height

    @publish(command=cmds.magdeck_disengage)
    @requires_version(2, 0)
    def disengage(self) -> None:
        """Lower the magnets back into the Magnetic Module."""
        self._module.deactivate()

    @property  # type: ignore
    @requires_version(2, 0)
    def status(self) -> str:
        """The status of the module; either 'engaged' or 'disengaged'"""
        return self._module.status


class ThermocyclerContext(ModuleContext[ThermocyclerGeometry]):
    """An object representing a connected Thermocycler Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0
    """

    def __init__(
        self,
        ctx: ProtocolContext,
        # TODO(mc, 2022-02-05): this type annotation is misleading;
        # a SynchronousAdapter wrapper is actually passed in
        hw_module: modules.thermocycler.Thermocycler,
        geometry: ThermocyclerGeometry,
        requested_as: ModuleModel,
        at_version: APIVersion,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, requested_as, at_version)

    def _prepare_for_lid_move(self) -> None:
        loaded_instruments = [
            instr
            for mount, instr in self._ctx._instruments.items()
            if instr is not None
        ]
        try:
            instr = loaded_instruments[0]
        except IndexError:
            MODULE_LOG.warning(
                "Cannot assure a safe gantry position to avoid colliding"
                " with the lid of the Thermocycler Module."
            )
        else:
            ctx_impl = self._ctx._implementation
            instr_impl = instr._implementation
            hardware = ctx_impl.get_hardware()

            hardware.retract(instr_impl.get_mount())
            high_point = hardware.current_position(instr_impl.get_mount())
            trash_top = self._ctx.fixed_trash.wells()[0].top()
            safe_point = trash_top.point._replace(
                z=high_point[Axis.by_mount(instr_impl.get_mount())]
            )
            instr.move_to(types.Location(safe_point, None), force_direct=True)

    def flag_unsafe_move(
        self, to_loc: types.Location, from_loc: types.Location
    ) -> None:
        cast(ThermocyclerGeometry, self.geometry).flag_unsafe_move(
            to_loc, from_loc, self.lid_position
        )

    @publish(command=cmds.thermocycler_open)
    @requires_version(2, 0)
    def open_lid(self) -> str:
        """Opens the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.open()  # type: ignore[assignment]
        return self._geometry.lid_status

    @publish(command=cmds.thermocycler_close)
    @requires_version(2, 0)
    def close_lid(self) -> str:
        """Closes the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.close()  # type: ignore[assignment]
        return self._geometry.lid_status

    @publish(command=cmds.thermocycler_set_block_temp)
    @requires_version(2, 0)
    def set_block_temperature(
        self,
        temperature: float,
        hold_time_seconds: Optional[float] = None,
        hold_time_minutes: Optional[float] = None,
        ramp_rate: Optional[float] = None,
        block_max_volume: Optional[float] = None,
    ) -> None:
        """Set the target temperature for the well block, in °C.

        Valid operational range yet to be determined.

        :param temperature: The target temperature, in °C.
        :param hold_time_minutes: The number of minutes to hold, after reaching
                                  ``temperature``, before proceeding to the
                                  next command.
        :param hold_time_seconds: The number of seconds to hold, after reaching
                                  ``temperature``, before proceeding to the
                                  next command. If ``hold_time_minutes`` and
                                  ``hold_time_seconds`` are not specified,
                                  the Thermocycler will proceed to the next
                                  command after ``temperature`` is reached.
        :param ramp_rate: The target rate of temperature change, in °C/sec.
                          If ``ramp_rate`` is not specified, it will default
                          to the maximum ramp rate as defined in the device
                          configuration.
        :param block_max_volume: The maximum volume of any individual well
                                 of the loaded labware. If not supplied,
                                 the thermocycler will default to 25µL/well.

        .. note:

            If ``hold_time_minutes`` and ``hold_time_seconds`` are not
            specified, the Thermocycler will proceed to the next command
            after ``temperature`` is reached.
        """
        self._module.set_temperature(
            temperature=temperature,
            hold_time_seconds=hold_time_seconds,
            hold_time_minutes=hold_time_minutes,
            ramp_rate=ramp_rate,
            volume=block_max_volume,
        )

    @publish(command=cmds.thermocycler_set_lid_temperature)
    @requires_version(2, 0)
    def set_lid_temperature(self, temperature: float) -> None:
        """Set the target temperature for the heated lid, in °C.

        :param temperature: The target temperature, in °C clamped to the
                            range 20°C to 105°C.

        .. note:

            The Thermocycler will proceed to the next command after
            ``temperature`` has been reached.

        """
        self._module.set_lid_temperature(temperature)

    @publish(command=cmds.thermocycler_execute_profile)
    @requires_version(2, 0)
    def execute_profile(
        self,
        steps: List[modules.ThermocyclerStep],
        repetitions: int,
        block_max_volume: Optional[float] = None,
    ) -> None:
        """Execute a Thermocycler Profile defined as a cycle of
        ``steps`` to repeat for a given number of ``repetitions``.

        :param steps: List of unique steps that make up a single cycle.
                      Each list item should be a dictionary that maps to
                      the parameters of the :py:meth:`set_block_temperature`
                      method with keys 'temperature', 'hold_time_seconds',
                      and 'hold_time_minutes'.
        :param repetitions: The number of times to repeat the cycled steps.
        :param block_max_volume: The maximum volume of any individual well
                                 of the loaded labware. If not supplied,
                                 the thermocycler will default to 25µL/well.

        .. note:

            Unlike the :py:meth:`set_block_temperature`, either or both of
            'hold_time_minutes' and 'hold_time_seconds' must be defined
            and finite for each step.

        """
        if repetitions <= 0:
            raise ValueError("repetitions must be a positive integer")
        for step in steps:
            if step.get("temperature") is None:
                raise ValueError("temperature must be defined for each step in cycle")
            hold_mins = step.get("hold_time_minutes")
            hold_secs = step.get("hold_time_seconds")
            if hold_mins is None and hold_secs is None:
                raise ValueError(
                    "either hold_time_minutes or hold_time_seconds must be"
                    "defined for each step in cycle"
                )
        self._module.cycle_temperatures(
            steps=steps, repetitions=repetitions, volume=block_max_volume
        )

    @publish(command=cmds.thermocycler_deactivate_lid)
    @requires_version(2, 0)
    def deactivate_lid(self) -> None:
        """Turn off the heated lid"""
        self._module.deactivate_lid()

    @publish(command=cmds.thermocycler_deactivate_block)
    @requires_version(2, 0)
    def deactivate_block(self) -> None:
        """Turn off the well block temperature controller"""
        self._module.deactivate_block()

    @publish(command=cmds.thermocycler_deactivate)
    @requires_version(2, 0)
    def deactivate(self) -> None:
        """Turn off the well block temperature controller, and heated lid"""
        self._module.deactivate()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_position(self) -> Optional[str]:
        """Lid open/close status string"""
        return self._module.lid_status

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_temperature_status(self) -> str:
        return self._module.status

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_temperature_status(self) -> Optional[str]:
        return self._module.lid_temp_status

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_temperature(self) -> Optional[float]:
        """Current temperature in degrees C"""
        return self._module.temperature

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_target_temperature(self) -> Optional[float]:
        """Target temperature in degrees C"""
        return self._module.target

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_temperature(self) -> Optional[float]:
        """Current temperature in degrees C"""
        return self._module.lid_temp

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_target_temperature(self) -> Optional[float]:
        """Target temperature in degrees C"""
        return self._module.lid_target

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def ramp_rate(self) -> Optional[float]:
        """Current ramp rate in degrees C/sec"""
        return self._module.ramp_rate

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def hold_time(self) -> Optional[float]:
        """Remaining hold time in sec"""
        return self._module.hold_time

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def total_cycle_count(self) -> Optional[int]:
        """Number of repetitions for current set cycle"""
        return self._module.total_cycle_count

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def current_cycle_index(self) -> Optional[int]:
        """Index of the current set cycle repetition"""
        return self._module.current_cycle_index

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def total_step_count(self) -> Optional[int]:
        """Number of steps within the current cycle"""
        return self._module.total_step_count

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def current_step_index(self) -> Optional[int]:
        """Index of the current step within the current cycle"""
        return self._module.current_step_index


class HeaterShakerContext(ModuleContext[HeaterShakerGeometry]):
    """An object representing a connected Heater-Shaker Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.13
    """

    def __init__(
        self,
        ctx: ProtocolContext,
        # TODO(mc, 2022-02-05): this type annotation is misleading;
        # a SynchronousAdapter wrapper is actually passed in
        hw_module: modules.heater_shaker.HeaterShaker,
        geometry: HeaterShakerGeometry,
        requested_as: ModuleModel,
        at_version: APIVersion,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, requested_as, at_version)

    # TODO: add API version requirement
    @property
    def target_temperature(self) -> Optional[float]:
        """Target temperature of the heater-shaker's plate."""
        return self._module.target_temperature

    # TODO: add API version requirement
    @property
    def current_temperature(self) -> float:
        """Current temperature of the heater-shaker's plate."""
        return self._module.temperature

    # TODO: add API version requirement
    @property
    def current_speed(self) -> int:
        """Current speed of the heater-shaker's plate."""
        return self._module.speed

    # TODO: add API version requirement
    @property
    def target_speed(self) -> Optional[int]:
        """Target speed of the heater-shaker's plate."""
        return self._module.target_speed

    # TODO: add API version requirement
    @property
    def temperature_status(self) -> str:
        """Heater-shaker's temperature status string.

        Returns one of these possible status values:
        - "holding at target"
        - "cooling"
        - "heating"
        - "idle"
        - "error"
        """
        return self._module.temperature_status.value

    # TODO: add API version requirement
    @property
    def speed_status(self) -> str:
        """Heater-shaker's speed status string.

        Returns one of these possible status values:
        - "holding at target"
        - "speeding up"
        - "slowing down"
        - "idle"
        - "error"
        """
        return self._module.speed_status.value

    # TODO: add API version requirement
    @property
    def labware_latch_status(self) -> str:
        """Heater-shaker's labware latch status string.

        Returns one of these possible status values:
        - "opening": latch is opening
        - "idle_open": latch is open and idle
        - "closing": latch is closing
        - "idle_closed": latch is closed and idle
        - "idle_unknown": status upon reset
        - "unknown": latch status cannot be reached, likely due to an error
        """
        return self._module.labware_latch_status.value

    # TODO: add API version requirement
    def set_and_wait_for_temperature(self, celsius: float) -> None:
        """Set the target temperature and wait for it to be reached.

        Note: The Heater-Shaker truncates the ``temperature`` parameter to 2 decimal places.

        :param celsius: The target temperature, in °C in range 37°C to 95°C.
        """
        self.set_target_temperature(celsius=celsius)
        self.wait_for_temperature()

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_set_target_temperature)
    def set_target_temperature(self, celsius: float) -> None:
        """Set target temperature and return immediately.

        Sets the heater-shaker's target temperature and returns immediately without
        waiting for the target to be reached. Does not delay the protocol until
        target temperature has reached. Use `wait_for_target_temperature` to delay
        protocol execution.

        Note: The H/S truncates the temperature param to 2 decimal places
        """
        validated_temp = validate_heater_shaker_temperature(celsius=celsius)
        self._module.start_set_temperature(celsius=validated_temp)

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_wait_for_temperature)
    def wait_for_temperature(self) -> None:
        """Wait for the Heater-Shaker to reach its target temperature.

        Delays protocol execution until the Heater-Shaker has reached its target
        temperature. The module must have a target temperature set previously.
        """
        if self.target_temperature is None:
            raise NoTargetTemperatureSetError(
                f"Heater-shaker module {self} does not have a target temperature set."
            )
        self._module.await_temperature(awaiting_temperature=self.target_temperature)

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_set_and_wait_for_shake_speed)
    def set_and_wait_for_shake_speed(self, rpm: int) -> None:
        """Set and wait for target speed.

        Set the heater shaker's target speed and wait until the specified speed has
        reached. Delays protocol execution until the target speed has been achieved.
        """
        if (
            self._module.labware_latch_status
            == HeaterShakerLabwareLatchStatus.IDLE_CLOSED
        ):
            validated_speed = validate_heater_shaker_speed(rpm=rpm)
            self._module.set_speed(rpm=validated_speed)
        else:
            # TODO: Figure out whether to issue close latch behind the scenes instead
            raise CannotPerformModuleAction(
                "Cannot start H/S shake unless labware latch is closed."
            )

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_open_labware_latch)
    def open_labware_latch(self) -> None:
        """Open the Heater-Shaker's labware latch.

        Note that the labware latch needs to be closed before:

        * Shaking
        * Pipetting to or from the labware on the Heater-Shaker
        * Pipetting to or from labware to the left or right of the Heater-Shaker

        Raises an error when attempting to open the latch while the Heater-Shaker is shaking.
        """
        if self._module.speed_status != module_types.SpeedStatus.IDLE:
            # TODO: What to do when speed status is ERROR?
            raise CannotPerformModuleAction(
                """Cannot open labware latch while module is shaking."""
            )
        self._module.open_labware_latch()

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_close_labware_latch)
    def close_labware_latch(self) -> None:
        """Close heater-shaker's labware latch"""
        self._module.close_labware_latch()

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_deactivate_shaker)
    def deactivate_shaker(self) -> None:
        """Stop shaking."""
        self._module.deactivate_shaker()

    # TODO: add API version requirement
    @publish(command=cmds.heater_shaker_deactivate_heater)
    def deactivate_heater(self) -> None:
        """Stop heating."""
        self._module.deactivate_heater()
