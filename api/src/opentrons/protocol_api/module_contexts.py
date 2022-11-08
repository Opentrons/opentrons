from __future__ import annotations

import logging
from typing import Generic, List, Optional, TypeVar, cast

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons import types
from opentrons.broker import Broker
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import SynchronousAdapter, modules
from opentrons.hardware_control.modules import ModuleModel, types as module_types
from opentrons.commands import module_commands as cmds
from opentrons.commands.publisher import CommandPublisher, publish
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version

from opentrons.protocols.geometry.module_geometry import (
    ModuleGeometry,
    ThermocyclerGeometry,
    HeaterShakerGeometry,
)

from .core.protocol import AbstractProtocol
from .core.instrument import AbstractInstrument
from .core.labware import AbstractLabware
from .core.module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
)
from .core.well import AbstractWellCore

from .module_validation_and_errors import (
    validate_heater_shaker_temperature,
    validate_heater_shaker_speed,
)
from .labware import Labware
from . import validation


ENGAGE_HEIGHT_UNIT_CNV = 2


_log = logging.getLogger(__name__)

GeometryType = TypeVar("GeometryType", bound=ModuleGeometry)

InstrumentCore = AbstractInstrument[AbstractWellCore]
LabwareCore = AbstractLabware[AbstractWellCore]
ModuleCore = AbstractModuleCore[LabwareCore]
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore]


class ModuleContext(CommandPublisher, Generic[GeometryType]):
    """A connected module in the protocol.

    .. versionadded:: 2.0
    """

    def __init__(
        self,
        core: ModuleCore,
        protocol_core: ProtocolCore,
        api_version: APIVersion,
        broker: Broker,
    ) -> None:
        super().__init__(broker=broker)
        self._core = core
        self._protocol_core = protocol_core
        self._api_version = api_version
        self._labware: Optional[Labware] = None

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    # TODO(mc, 2022-09-08): Remove this method
    @requires_version(2, 0)
    def load_labware_object(self, labware: Labware) -> Labware:
        """Specify the presence of a piece of labware on the module.

        :param labware: The labware object. This object should be already
                        initialized and its parent should be set to this
                        module's geometry. To initialize and load a labware
                        onto the module in one step, see
                        :py:meth:`load_labware`.
        :returns: The properly-linked labware object

        .. deprecated:: 2.14
            Use :py:meth:`load_labware` or :py:meth:`load_labware_by_definition`.
        """
        _log.warning(
            "`module.load_labware_object` is an internal, deprecated method."
            " Use `module.load_labware` or `load_labware_by_definition` instead."
        )
        assert (
            labware.parent == self.geometry
        ), "Labware is not configured with this module as its parent"

        return self._core.geometry.add_labware(labware)

    def load_labware(
        self,
        name: str,
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: int = 1,
    ) -> Labware:
        """Load a labware onto the module using its load parameters.

        :param name: The name of the labware object.
        :param str label: An optional display name to give the labware.
                          If specified, this is the name the labware will use
                          in the run log and the calibration view in the Opentrons App.
        :param str namespace: The namespace the labware definition belongs to.
                              If unspecified, will search 'opentrons' then 'custom_beta'
        :param int version: The version of the labware definition.
                            If unspecified, will use version 1.

        :returns: The initialized and loaded labware object.

        .. versionadded:: 2.1
            The *label,* *namespace,* and *version* parameters.
        """
        if self._api_version < APIVersion(2, 1) and (
            label is not None or namespace is not None or version != 1
        ):
            _log.warning(
                f"You have specified API {self.api_version}, but you "
                "are trying to utilize new load_labware parameters in 2.1"
            )

        labware_core = self._protocol_core.load_labware(
            load_name=name,
            label=label,
            namespace=namespace,
            version=version,
            location=self._core,
        )

        self._core.add_labware_core(labware_core)

        # TODO(mc, 2022-09-02): add API version
        # https://opentrons.atlassian.net/browse/RSS-97
        labware = self._core.geometry.add_labware(Labware(implementation=labware_core))

        # TODO(mc, 2022-09-08): move this into legacy PAPIv2 implementation
        # by reworking the `Deck` and/or `ModuleGeometry` interface
        self._protocol_core.get_deck().recalculate_high_z()

        return labware

    @requires_version(2, 0)
    def load_labware_from_definition(
        self, definition: LabwareDefinition, label: Optional[str] = None
    ) -> Labware:
        """Load a labware onto the module using an inline definition.

        :param definition: The labware definition.
        :param str label: An optional special name to give the labware. If
                          specified, this is the name the labware will appear
                          as in the run log and the calibration view in the
                          Opentrons app.
        :returns: The initialized and loaded labware object.
        """
        load_params = self._protocol_core.add_labware_definition(definition)

        return self.load_labware(
            name=load_params.load_name,
            namespace=load_params.namespace,
            version=load_params.version,
            label=label,
        )

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
        _log.warning("load_labware_by_name is deprecated. Use load_labware instead.")
        return self.load_labware(
            name=name, label=label, namespace=namespace, version=version
        )

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def labware(self) -> Optional[Labware]:
        """The labware (if any) present on this module."""
        return self._core.geometry.labware

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def geometry(self) -> GeometryType:
        """The object representing the module as an item on the deck.

        :returns: ModuleGeometry
        """
        return cast(GeometryType, self._core.geometry)

    @property
    def requested_as(self) -> ModuleModel:
        """How the protocol requested this module.

        For example, a physical ``temperatureModuleV2`` might have been requested
        either as ``temperatureModuleV2`` or ``temperatureModuleV1``.

        For Opentrons internal use only.

        :meta private:
        """
        return self._core.get_requested_model()

    # TODO(mc, 2022-09-08): remove this property
    @property
    def _module(self) -> SynchronousAdapter[modules.AbstractModule]:
        return self._core._sync_module_hardware  # type: ignore[attr-defined, no-any-return]

    def __repr__(self) -> str:
        return "{} at {} lw {}".format(
            self.__class__.__name__, self.geometry, self.labware
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

    _core: AbstractTemperatureModuleCore[AbstractLabware[AbstractWellCore]]

    @publish(command=cmds.tempdeck_set_temp)
    @requires_version(2, 0)
    def set_temperature(self, celsius: float) -> None:
        """Set the target temperature, in °C, waiting for the target to be hit.

        Must be between 4 and 95 °C based on Opentrons QA.

        :param celsius: The target temperature, in °C
        """
        self._core.set_target_temperature(celsius)
        self._core.wait_for_target_temperature()

    @publish(command=cmds.tempdeck_set_temp)
    @requires_version(2, 3)
    def start_set_temperature(self, celsius: float) -> None:
        """Set the target temperature, in °C, without waiting for the target to be hit.

        Must be between 4 and 95 °C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        self._core.set_target_temperature(celsius)

    @publish(command=cmds.tempdeck_await_temp)
    @requires_version(2, 3)
    def await_temperature(self, celsius: float) -> None:
        """Wait until module reaches temperature, in °C.

        Must be between 4 and 95 °C based on Opentrons QA.

        :param celsius: The target temperature, in °C
        """
        self._core.wait_for_target_temperature(celsius)

    @publish(command=cmds.tempdeck_deactivate)
    @requires_version(2, 0)
    def deactivate(self) -> None:
        """Stop heating (or cooling) and turn off the fan."""
        self._core.deactivate()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def temperature(self) -> float:
        """Current temperature in °C."""
        return self._core.get_current_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def target(self) -> Optional[float]:
        """Current target temperature in °C."""
        return self._core.get_target_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 3)
    def status(self) -> str:
        """The status of the module.

        Returns ``holding at target``, ``cooling``, ``heating``, or ``idle``.
        """
        return self._core.get_status().value


class MagneticModuleContext(ModuleContext[ModuleGeometry]):
    """An object representing a connected Magnetic Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0
    """

    _core: AbstractMagneticModuleCore[AbstractLabware[AbstractWellCore]]

    @publish(command=cmds.magdeck_calibrate)
    @requires_version(2, 0)
    def calibrate(self) -> None:
        """Calibrate the Magnetic Module.

        .. deprecated:: 2.14
            This method is unncessary; remove any usage.
        """
        _log.warning(
            "`MagneticModuleContext.calibrate` doesn't do anything useful"
            " and will no-op in Protocol API version 2.14 and higher."
        )
        if self._api_version < APIVersion(2, 14):
            self._core._sync_module_hardware.calibrate()  # type: ignore[attr-defined]

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
            self._core.engage(height_from_home=height)

        # This version check has a bug:
        # if the caller sets height_from_base in an API version that's too low,
        # we will silently ignore it instead of raising APIVersionError.
        # Leaving this unfixed because we haven't thought through
        # how to do backwards-compatible fixes to our version checking itself.
        elif height_from_base is not None and self._api_version >= APIVersion(2, 2):
            self._core.engage(height_from_base=height_from_base)

        else:
            self._core.engage_to_labware(
                offset=offset or 0,
                preserve_half_mm=self._api_version < APIVersion(2, 3),
            )

    @publish(command=cmds.magdeck_disengage)
    @requires_version(2, 0)
    def disengage(self) -> None:
        """Lower the magnets back into the Magnetic Module."""
        self._core.disengage()

    @property  # type: ignore
    @requires_version(2, 0)
    def status(self) -> str:
        """The status of the module: either ``engaged`` or ``disengaged``"""
        return self._core.get_status().value


class ThermocyclerContext(ModuleContext[ThermocyclerGeometry]):
    """An object representing a connected Thermocycler Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0
    """

    _core: AbstractThermocyclerCore[AbstractLabware[AbstractWellCore]]

    def flag_unsafe_move(
        self, to_loc: types.Location, from_loc: types.Location
    ) -> None:
        self.geometry.flag_unsafe_move(to_loc, from_loc, self.lid_position)

    @publish(command=cmds.thermocycler_open)
    @requires_version(2, 0)
    def open_lid(self) -> str:
        """Opens the lid"""
        return self._core.open_lid().value

    @publish(command=cmds.thermocycler_close)
    @requires_version(2, 0)
    def close_lid(self) -> str:
        """Closes the lid"""
        return self._core.close_lid().value

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
        seconds = validation.ensure_hold_time_seconds(
            seconds=hold_time_seconds, minutes=hold_time_minutes
        )
        self._core.set_target_block_temperature(
            celsius=temperature,
            hold_time_seconds=seconds,
            block_max_volume=block_max_volume,
        )
        self._core.wait_for_block_temperature()

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
        self._core.set_target_lid_temperature(celsius=temperature)
        self._core.wait_for_lid_temperature()

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
        self._core.execute_profile(
            steps=steps, repetitions=repetitions, block_max_volume=block_max_volume
        )

    @publish(command=cmds.thermocycler_deactivate_lid)
    @requires_version(2, 0)
    def deactivate_lid(self) -> None:
        """Turn off the heated lid"""
        self._core.deactivate_lid()

    @publish(command=cmds.thermocycler_deactivate_block)
    @requires_version(2, 0)
    def deactivate_block(self) -> None:
        """Turn off the well block temperature controller"""
        self._core.deactivate_block()

    @publish(command=cmds.thermocycler_deactivate)
    @requires_version(2, 0)
    def deactivate(self) -> None:
        """Turn off the well block temperature controller, and heated lid"""
        self._core.deactivate()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_position(self) -> Optional[str]:
        """Lid open/close status string"""
        # TODO(mc, 2022-11-08): this will never be None, update typings and logic
        position = self._core.get_lid_position()
        return position.value if position is not None else None

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_temperature_status(self) -> str:
        """Block temperature status string"""
        return self._core.get_block_temperature_status().value

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_temperature_status(self) -> Optional[str]:
        """Lid temperature status string"""
        # TODO(mc, 2022-11-08): this will never be None, update typings and logic
        status = self._core.get_lid_temperature_status()
        return status.value if status is not None else None

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_temperature(self) -> Optional[float]:
        """Current temperature in degrees C"""
        return self._core.get_block_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def block_target_temperature(self) -> Optional[float]:
        """Target temperature in degrees C"""
        return self._core.get_block_target_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_temperature(self) -> Optional[float]:
        """Current temperature in degrees C"""
        return self._core.get_lid_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def lid_target_temperature(self) -> Optional[float]:
        """Target temperature in degrees C"""
        return self._core.get_lid_target_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def ramp_rate(self) -> Optional[float]:
        """Current ramp rate in degrees C/sec"""
        return self._core.get_ramp_rate()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def hold_time(self) -> Optional[float]:
        """Remaining hold time in sec"""
        return self._core.get_hold_time()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def total_cycle_count(self) -> Optional[int]:
        """Number of repetitions for current set cycle"""
        return self._core.get_total_cycle_count()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def current_cycle_index(self) -> Optional[int]:
        """Index of the current set cycle repetition"""
        return self._core.get_current_cycle_index()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def total_step_count(self) -> Optional[int]:
        """Number of steps within the current cycle"""
        return self._core.get_total_step_count()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def current_step_index(self) -> Optional[int]:
        """Index of the current step within the current cycle"""
        return self._core.get_current_step_index()


class HeaterShakerContext(ModuleContext[HeaterShakerGeometry]):
    """An object representing a connected Heater-Shaker Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.13
    """

    _core: AbstractHeaterShakerCore[AbstractLabware[AbstractWellCore]]

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def target_temperature(self) -> Optional[float]:
        """The target temperature of the Heater-Shaker's plate in °C.

        Returns ``None`` if no target has been set.
        """
        return self._core.get_target_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def current_temperature(self) -> float:
        """The current temperature of the Heater-Shaker's plate in °C.

        Returns ``23`` in simulation if no target temperature has been set.
        """
        return self._core.get_current_temperature()

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def current_speed(self) -> int:
        """The current speed in RPM of the Heater-Shaker's plate."""
        return self._core.get_current_speed()

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def target_speed(self) -> Optional[int]:
        """Target speed in RPM of the Heater-Shaker's plate."""
        return self._core.get_target_speed()

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def temperature_status(self) -> str:
        """One of five possible temperature statuses:

        - ``holding at target``: The module has reached its target temperature
            and is actively maintaining that temperature.
        - ``cooling``: The module has previously heated and is now passively cooling.
            `The Heater-Shaker does not have active cooling.`
        - ``heating``: The module is heating to a target temperature.
        - ``idle``: The module has not heated since the beginning of the protocol.
        - ``error``: The temperature status can't be determined.
        """
        return self._core.get_temperature_status().value

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def speed_status(self) -> str:
        """One of five possible shaking statuses:

        - ``holding at target``: The module has reached its target shake speed
            and is actively maintaining that speed.
        - ``speeding up``: The module is increasing its shake speed towards a target.
        - ``slowing down``: The module was previously shaking at a faster speed
            and is currently reducing its speed to a lower target or to deactivate.
        - ``idle``: The module is not shaking.
        - ``error``: The shaking status can't be determined.
        """
        return self._core.get_speed_status().value

    @property  # type: ignore[misc]
    @requires_version(2, 13)
    def labware_latch_status(self) -> str:
        """One of six possible latch statuses:

        - ``opening``: The latch is currently opening (in motion).
        - ``idle_open``: The latch is open and not moving.
        - ``closing``: The latch is currently closing (in motion).
        - ``idle_closed``: The latch is closed and not moving.
        - ``idle_unknown``: The default status upon reset, regardless of physical latch position.
            Use :py:meth:`~HeaterShakerContext.close_labware_latch` before other commands
            requiring confirmation that the latch is closed.
        - ``unknown``: The latch status can't be determined.
        """
        return self._core.get_labware_latch_status().value

    @requires_version(2, 13)
    def set_and_wait_for_temperature(self, celsius: float) -> None:
        """Set a target temperature and wait until the module reaches the target.

        No other protocol commands will execute while waiting for the temperature.

        :param celsius: A value between 27 and 95, representing the target temperature in °C.
                        Values are automatically truncated to two decimal places,
                        and the Heater-Shaker module has a temperature accuracy of ±0.5 °C.
        """
        self.set_target_temperature(celsius=celsius)
        self.wait_for_temperature()

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_set_target_temperature)
    def set_target_temperature(self, celsius: float) -> None:
        """Set target temperature and return immediately.

        Sets the Heater-Shaker's target temperature and returns immediately without
        waiting for the target to be reached. Does not delay the protocol until
        target temperature has reached. Use `wait_for_target_temperature` to delay
        protocol execution.

        :param celsius: A value between 27 and 95, representing the target temperature in °C.
                        Values are automatically truncated to two decimal places,
                        and the Heater-Shaker module has a temperature accuracy of ±0.5 °C.
        """
        validated_temp = validate_heater_shaker_temperature(celsius=celsius)
        self._core.set_target_temperature(celsius=validated_temp)

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_wait_for_temperature)
    def wait_for_temperature(self) -> None:
        """Delays protocol execution until the Heater-Shaker has reached its target
        temperature. Returns an error if no target temperature was previously set.
        """
        self._core.wait_for_target_temperature()

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_set_and_wait_for_shake_speed)
    def set_and_wait_for_shake_speed(self, rpm: int) -> None:
        """Set a shake speed in RPM and block execution of further commands until the module reaches the target.

        Reaching a target shake speed typically only takes a few seconds.

        .. note::

            Before shaking, this command will retract the pipettes upward if they are parked adjacent to the Heater-Shaker.

        :param rpm: A value between 200 and 3000, representing the target shake speed in revolutions per minute.
        """
        validated_speed = validate_heater_shaker_speed(rpm=rpm)
        self._core.set_and_wait_for_shake_speed(rpm=validated_speed)

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_open_labware_latch)
    def open_labware_latch(self) -> None:
        """Open the Heater-Shaker's labware latch.

        The labware latch needs to be closed before:
            * Shaking
            * Pipetting to or from the labware on the Heater-Shaker
            * Pipetting to or from labware to the left or right of the Heater-Shaker

        Attempting to open the latch while the Heater-Shaker is shaking will raise an error.

        .. note::

            Before opening the latch, this command will retract the pipettes upward
            if they are parked adjacent to the left or right of the Heater-Shaker.
        """
        self._core.open_labware_latch()

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_close_labware_latch)
    def close_labware_latch(self) -> None:
        """Closes the labware latch.

        The labware latch needs to be closed using this method before sending a shake command,
        even if the latch was manually closed before starting the protocol.
        """
        self._core.close_labware_latch()

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_deactivate_shaker)
    def deactivate_shaker(self) -> None:
        """Stops shaking.

        Decelerating to 0 RPM typically only takes a few seconds.
        """
        self._core.deactivate_shaker()

    @requires_version(2, 13)
    @publish(command=cmds.heater_shaker_deactivate_heater)
    def deactivate_heater(self) -> None:
        """Stops heating.

        The module will passively cool to room temperature.
        The Heater-Shaker does not have active cooling.
        """
        self._core.deactivate_heater()

    def flag_unsafe_move(
        self,
        to_loc: types.Location,
        is_multichannel: bool,
    ) -> None:
        """
        Raise an error if attempting to perform a move that's deemed unsafe due to
        the presence of the Heater-Shaker.

        :meta private:
        """
        destination_slot = to_loc.labware.first_parent()
        if destination_slot is None:
            _log.warning(
                "Pipette movement destination has no slot associated with it. Cannot"
                " determine whether movement will safely avoid colliding with the Heater-Shaker."
            )
            return

        is_labware_latch_closed = (
            self._module.labware_latch_status
            == HeaterShakerLabwareLatchStatus.IDLE_CLOSED
        )
        is_plate_shaking = self._module.speed_status != module_types.SpeedStatus.IDLE

        to_labware_like = to_loc.labware
        is_tiprack: bool
        if (
            to_labware_like.is_labware
        ):  # Do we consider this a valid location for move_to?
            is_tiprack = to_labware_like.as_labware().is_tiprack
        elif to_labware_like.parent.is_labware:
            is_tiprack = to_labware_like.parent.as_labware().is_tiprack
        else:
            raise Exception(
                "Invalid destination location type. "
                "Cannot determine pipette movement safety."
            )

        self.geometry.flag_unsafe_move(
            to_slot=int(destination_slot),
            is_tiprack=is_tiprack,
            is_using_multichannel=is_multichannel,
            is_plate_shaking=is_plate_shaking,
            is_labware_latch_closed=is_labware_latch_closed,
        )
