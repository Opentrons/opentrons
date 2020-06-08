import asyncio
import logging
from typing import Generic, List, Optional, TYPE_CHECKING, TypeVar

from opentrons import types, commands as cmds
from opentrons.hardware_control import modules
from opentrons.hardware_control.types import Axis
from opentrons.commands import CommandPublisher
from opentrons.protocols.types import APIVersion

from .labware import (
    Labware, load, load_from_definition)
from .module_geometry import ModuleGeometry, ThermocyclerGeometry
from . import geometry
from .util import requires_version

if TYPE_CHECKING:
    from .protocol_context import ProtocolContext
    from opentrons_shared_data.labware.dev_types import (LabwareDefinition)

ENGAGE_HEIGHT_UNIT_CNV = 2
STANDARD_MAGDECK_LABWARE = [
    'biorad_96_wellplate_200ul_pcr',
    'nest_96_wellplate_100ul_pcr_full_skirt',
    'usascientific_96_wellplate_2.4ml_deep']

MODULE_LOG = logging.getLogger(__name__)

GeometryType = TypeVar('GeometryType', bound=ModuleGeometry)
class ModuleContext(CommandPublisher, Generic[GeometryType]):  # noqa(E302)
    """ An object representing a connected module.


    .. versionadded:: 2.0

    """

    def __init__(self,
                 ctx: 'ProtocolContext',
                 geometry: GeometryType,
                 at_version: APIVersion) -> None:
        """ Build the ModuleContext.

        This usually should not be instantiated directly; instead, modules
        should be loaded using :py:meth:`ProtocolContext.load_module`.

        :param ctx: The parent context for the module
        :param geometry: The :py:class:`.ModuleGeometry` for the module
        """
        super().__init__(ctx.broker)
        self._geometry = geometry
        self._ctx = ctx
        self._api_version = at_version

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @requires_version(2, 0)
    def load_labware_object(self, labware: Labware) -> Labware:
        """ Specify the presence of a piece of labware on the module.

        :param labware: The labware object. This object should be already
                        initialized and its parent should be set to this
                        module's geometry. To initialize and load a labware
                        onto the module in one step, see
                        :py:meth:`load_labware`.
        :returns: The properly-linked labware object
        """
        mod_labware = self._geometry.add_labware(labware)
        self._ctx.deck.recalculate_high_z()
        return mod_labware

    @requires_version(2, 0)
    def load_labware(
            self,
            name: str,
            label: str = None,
            namespace: str = None,
            version: int = 1,
            ) -> Labware:
        """ Specify the presence of a piece of labware on the module.

        :param name: The name of the labware object.
        :param str label: An optional special name to give the labware. If
                          specified, this is the name the labware will appear
                          as in the run log and the calibration view in the
                          Opentrons app.
        .. versionadded:: 2.1
        :param str namespace: The namespace the labware definition belongs to.
            If unspecified, will search 'opentrons' then 'custom_beta'
        .. versionadded:: 2.1
        :param int version: The version of the labware definition. If
            unspecified, will use version 1.
        .. versionadded:: 2.1
        :returns: The initialized and loaded labware object.
        """
        if self.api_version < APIVersion(2, 1) and\
                (label or namespace or version):
            MODULE_LOG.warning(
                f'You have specified API {self.api_version}, but you '
                'are trying to utilize new load_labware parameters in 2.1')
        lw = load(name, self._geometry.location,
                  label, namespace, version,
                  bundled_defs=self._ctx._bundled_labware,
                  extra_defs=self._ctx._extra_labware)
        return self.load_labware_object(lw)

    @requires_version(2, 0)
    def load_labware_from_definition(
            self,
            definition: 'LabwareDefinition',
            label: str = None) -> Labware:
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
        lw = load_from_definition(
            definition, self._geometry.location, label)
        return self.load_labware_object(lw)

    @requires_version(2, 1)
    def load_labware_by_name(self,
                             name: str,
                             label: str = None,
                             namespace: str = None,
                             version: int = 1,) -> Labware:
        MODULE_LOG.warning(
            'load_labware_by_name is deprecated and will be removed in '
            'version 3.12.0. please use load_labware')
        return self.load_labware(name, label, namespace, version)

    @property  # type: ignore
    @requires_version(2, 0)
    def labware(self) -> Optional[Labware]:
        """ The labware (if any) present on this module. """
        return self._geometry.labware

    @property  # type: ignore
    @requires_version(2, 0)
    def geometry(self) -> ModuleGeometry:
        """ The object representing the module as an item on the deck

        :returns: ModuleGeometry
        """
        return self._geometry

    def __repr__(self):
        return "{} at {} lw {}".format(self.__class__.__name__,
                                       self._geometry,
                                       self.labware)


class TemperatureModuleContext(ModuleContext[ModuleGeometry]):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module` using:
    ``ctx.load_module('Temperature Module', slot_number)``.

    A minimal protocol with a Temperature module would look like this:

    .. code block:: python

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
    def __init__(self, ctx: 'ProtocolContext',
                 hw_module: modules.tempdeck.TempDeck,
                 geometry: ModuleGeometry,
                 at_version: APIVersion,
                 loop: asyncio.AbstractEventLoop) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, at_version)

    @cmds.publish.both(command=cmds.tempdeck_set_temp)
    @requires_version(2, 0)
    def set_temperature(self, celsius: float):
        """ Set the target temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        return self._module.set_temperature(celsius)

    @cmds.publish.both(command=cmds.tempdeck_set_temp)
    @requires_version(2, 3)
    def start_set_temperature(self, celsius: float):
        """ Start setting the target temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        return self._module.start_set_temperature(celsius)

    @cmds.publish.both(command=cmds.tempdeck_await_temp)
    @requires_version(2, 3)
    def await_temperature(self, celsius: float):
        """ Wait until module reaches temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        return self._module.await_temperature(celsius)

    @cmds.publish.both(command=cmds.tempdeck_deactivate)
    @requires_version(2, 0)
    def deactivate(self):
        """ Stop heating (or cooling) and turn off the fan.
        """
        return self._module.deactivate()

    @property  # type: ignore
    @requires_version(2, 0)
    def temperature(self):
        """ Current temperature in C"""
        return self._module.temperature

    @property  # type: ignore
    @requires_version(2, 0)
    def target(self):
        """ Current target temperature in C"""
        return self._module.target

    @property  # type: ignore
    @requires_version(2, 3)
    def status(self):
        """ The status of the module.

        Returns 'holding at target', 'cooling', 'heating', or 'idle'

        """
        return self._module.status


class MagneticModuleContext(ModuleContext[ModuleGeometry]):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0

    """
    def __init__(self,
                 ctx: 'ProtocolContext',
                 hw_module: modules.magdeck.MagDeck,
                 geometry: ModuleGeometry,
                 at_version: APIVersion,
                 loop: asyncio.AbstractEventLoop) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, at_version)

    @cmds.publish.both(command=cmds.magdeck_calibrate)
    @requires_version(2, 0)
    def calibrate(self):
        """ Calibrate the Magnetic Module.

        The calibration is used to establish the position of the lawbare on
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
                " calling engage().")
        return super().load_labware_object(labware)

    @cmds.publish.both(command=cmds.magdeck_engage)
    @requires_version(2, 0)
    def engage(self,
               height: float = None,
               offset: float = None,
               height_from_base: float = None):
        """ Raise the Magnetic Module's magnets.

        The destination of the magnets can be specified in several different
        ways, based on internally stored default heights for labware:

           - If neither ``height``, ``height_from_base`` nor ``offset`` is
             specified, the magnets will raise to a reasonable default height
             based on the specified labware.
           - The recommended way to adjust the height of the magnets is to
             specify ``height_from_base``, which should be a distance in mm
             relative to the base of the labware that is on the magnetic module
           - If ``height`` is specified, it should be a distance in mm from the
             home position of the magnets.
           - If ``offset`` is specified, it should be an offset in mm from the
             default position. A positive number moves the magnets higher and
             a negative number moves the magnets lower.

        Only certain labwares have defined engage heights for the Magnetic
        Module. If a labware that does not have a defined engage height is
        loaded on the Magnetic Module (or if no labware is loaded), then
        ``height`` or ``height_from_labware`` must be specified.

        :param height_from_base: The height to raise the magnets to, in mm from
                                 the base of the labware
        .. versionadded:: 2.1
        :param height: The height to raise the magnets to, in mm from home.
        :param offset: An offset relative to the default height for the labware
                       in mm
        """
        if height is not None:
            dist = height
        elif height_from_base is not None and\
                self._ctx._api_version >= APIVersion(2, 2):
            dist = height_from_base +\
                modules.magdeck.OFFSET_TO_LABWARE_BOTTOM[self._module.model()]
        elif self.labware and self.labware.magdeck_engage_height is not None:
            dist = self._determine_lw_engage_height()
            if offset:
                dist += offset
        else:
            raise ValueError(
                "Currently loaded labware {} does not have a known engage "
                "height; please specify explicitly with the height param"
                .format(self.labware))
        self._module.engage(dist)

    def _determine_lw_engage_height(self) -> float:
        """ Return engage height based on Protocol API and module versions

        For API Version 2.3 or later:
           - Multiply non-standard labware engage heights by 2 for gen1 modules
           - Divide standard labware engage heights by 2 for gen2 modules
        If none of the above, return the labware engage heights as defined in
        the labware definitions
        """
        assert self.labware, self.labware.magdeck_engage_height

        engage_height = self.labware.magdeck_engage_height

        is_api_breakpoint = (self._ctx._api_version >= APIVersion(2, 3))
        is_v1_module = (self._module.model() == 'magneticModuleV1')
        is_standard_lw = self.labware.load_name in STANDARD_MAGDECK_LABWARE

        if is_api_breakpoint and is_v1_module and not is_standard_lw:
            return engage_height * ENGAGE_HEIGHT_UNIT_CNV
        elif is_api_breakpoint and not is_v1_module and is_standard_lw:
            return engage_height / ENGAGE_HEIGHT_UNIT_CNV
        else:
            return engage_height

    @cmds.publish.both(command=cmds.magdeck_disengage)
    @requires_version(2, 0)
    def disengage(self):
        """ Lower the magnets back into the Magnetic Module.
        """
        self._module.deactivate()

    @property  # type: ignore
    @requires_version(2, 0)
    def status(self):
        """ The status of the module. either 'engaged' or 'disengaged' """
        return self._module.status


class ThermocyclerContext(ModuleContext[ThermocyclerGeometry]):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0
    """
    def __init__(self,
                 ctx: 'ProtocolContext',
                 hw_module: modules.thermocycler.Thermocycler,
                 geometry: ThermocyclerGeometry,
                 at_version: APIVersion,
                 loop: asyncio.AbstractEventLoop) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry, at_version)

    def _prepare_for_lid_move(self):
        loaded_instruments = [instr for mount, instr in
                              self._ctx.loaded_instruments.items()
                              if instr is not None]
        try:
            instr = loaded_instruments[0]
        except IndexError:
            MODULE_LOG.warning(
                "Cannot assure a safe gantry position to avoid colliding"
                " with the lid of the Thermocycler Module.")
        else:
            self._ctx._hw_manager.hardware.retract(instr._mount)
            high_point = self._ctx._hw_manager.hardware.current_position(
                    instr._mount)
            trash_top = self._ctx.fixed_trash.wells()[0].top()
            safe_point = trash_top.point._replace(
                    z=high_point[Axis.by_mount(instr._mount)])
            instr.move_to(types.Location(safe_point, None), force_direct=True)

    def flag_unsafe_move(self,
                         to_loc: types.Location,
                         from_loc: types.Location):
        to_lw, to_well = geometry.split_loc_labware(to_loc)
        from_lw, from_well = geometry.split_loc_labware(from_loc)
        if self.labware is not None and \
                (self.labware is to_lw or self.labware is from_lw) and \
                self.lid_position != 'open':
            raise RuntimeError(
                "Cannot move to labware loaded in Thermocycler"
                " when lid is not fully open.")

    @cmds.publish.both(command=cmds.thermocycler_open)
    @requires_version(2, 0)
    def open_lid(self):
        """ Opens the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.open()  # type: ignore
        return self._geometry.lid_status

    @cmds.publish.both(command=cmds.thermocycler_close)
    @requires_version(2, 0)
    def close_lid(self):
        """ Closes the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.close()  # type: ignore
        return self._geometry.lid_status

    @cmds.publish.both(command=cmds.thermocycler_set_block_temp)
    @requires_version(2, 0)
    def set_block_temperature(self,
                              temperature: float,
                              hold_time_seconds: float = None,
                              hold_time_minutes: float = None,
                              ramp_rate: float = None,
                              block_max_volume: float = None):
        """ Set the target temperature for the well block, in °C.

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

        return self._module.set_temperature(
                temperature=temperature,
                hold_time_seconds=hold_time_seconds,
                hold_time_minutes=hold_time_minutes,
                ramp_rate=ramp_rate,
                volume=block_max_volume)

    @cmds.publish.both(command=cmds.thermocycler_set_lid_temperature)
    @requires_version(2, 0)
    def set_lid_temperature(self, temperature: float):
        """ Set the target temperature for the heated lid, in °C.

        :param temperature: The target temperature, in °C clamped to the
                            range 20°C to 105°C.

        .. note:

            The Thermocycler will proceed to the next command after
            ``temperature`` has been reached.

        """
        self._module.set_lid_temperature(temperature)

    @cmds.publish.both(command=cmds.thermocycler_execute_profile)
    @requires_version(2, 0)
    def execute_profile(self,
                        steps: List[modules.ThermocyclerStep],
                        repetitions: int,
                        block_max_volume: float = None):
        """ Execute a Thermocycler Profile defined as a cycle of
        :py:attr:`steps` to repeat for a given number of :py:attr:`repetitions`

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
            if step.get('temperature') is None:
                raise ValueError(
                        "temperature must be defined for each step in cycle")
            hold_mins = step.get('hold_time_minutes')
            hold_secs = step.get('hold_time_seconds')
            if hold_mins is None and hold_secs is None:
                raise ValueError(
                        "either hold_time_minutes or hold_time_seconds must be"
                        "defined for each step in cycle")
        return self._module.cycle_temperatures(steps=steps,
                                               repetitions=repetitions,
                                               volume=block_max_volume)

    @cmds.publish.both(command=cmds.thermocycler_deactivate_lid)
    @requires_version(2, 0)
    def deactivate_lid(self):
        """ Turn off the heated lid """
        self._module.deactivate_lid()

    @cmds.publish.both(command=cmds.thermocycler_deactivate_block)
    @requires_version(2, 0)
    def deactivate_block(self):
        """ Turn off the well block temperature controller"""
        self._module.deactivate_block()

    @cmds.publish.both(command=cmds.thermocycler_deactivate)
    @requires_version(2, 0)
    def deactivate(self):
        """ Turn off the well block temperature controller, and heated lid """
        self._module.deactivate()

    @property  # type: ignore
    @requires_version(2, 0)
    def lid_position(self):
        """ Lid open/close status string"""
        return self._module.lid_status

    @property  # type: ignore
    @requires_version(2, 0)
    def block_temperature_status(self):
        return self._module.status

    @property  # type: ignore
    @requires_version(2, 0)
    def lid_temperature_status(self):
        return self._module.lid_temp_status

    @property  # type: ignore
    @requires_version(2, 0)
    def block_temperature(self):
        """ Current temperature in degrees C """
        return self._module.temperature

    @property  # type: ignore
    @requires_version(2, 0)
    def block_target_temperature(self):
        """ Target temperature in degrees C """
        return self._module.target

    @property  # type: ignore
    @requires_version(2, 0)
    def lid_temperature(self):
        """ Current temperature in degrees C """
        return self._module.lid_temp

    @property  # type: ignore
    @requires_version(2, 0)
    def lid_target_temperature(self):
        """ Target temperature in degrees C """
        return self._module.lid_target

    @property  # type: ignore
    @requires_version(2, 0)
    def ramp_rate(self):
        """ Current ramp rate in degrees C/sec"""
        return self._module.ramp_rate

    @property  # type: ignore
    @requires_version(2, 0)
    def hold_time(self):
        """ Remaining hold time in sec"""
        return self._module.hold_time

    @property  # type: ignore
    @requires_version(2, 0)
    def total_cycle_count(self):
        """ Number of repetitions for current set cycle"""
        return self._module.total_cycle_count

    @property  # type: ignore
    @requires_version(2, 0)
    def current_cycle_index(self):
        """ Index of the current set cycle repetition"""
        return self._module.current_cycle_index

    @property  # type: ignore
    @requires_version(2, 0)
    def total_step_count(self):
        """ Number of steps within the current cycle"""
        return self._module.total_step_count

    @property  # type: ignore
    @requires_version(2, 0)
    def current_step_index(self):
        """ Index of the current step within the current cycle"""
        return self._module.current_step_index
