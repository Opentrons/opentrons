import asyncio
import contextlib
import logging
from typing import (Any, Dict, Iterator, List,
                    Optional, Sequence, Set, Tuple, Union)
from opentrons import types, hardware_control as hc, commands as cmds
from opentrons.commands import CommandPublisher
from opentrons.config import feature_flags as fflags
from opentrons.hardware_control import adapters, modules
from opentrons.hardware_control.simulator import Simulator
from opentrons.hardware_control.types import CriticalPoint, Axis
from .labware import (Well, Labware, get_labware_definition, load_module,
                      ModuleGeometry, quirks_from_any_parent,
                      ThermocyclerGeometry, OutOfTipsError,
                      select_tiprack_from_list, filter_tipracks_to_start,
                      LabwareDefinition, load_from_definition, load)
from opentrons.protocols.types import APIVersion, Protocol
from .util import (FlowRates, PlungerSpeeds, Clearances, AxisMaxSpeeds,
                   HardwareManager, clamp_value, requires_version)

from . import geometry
from . import transfers
from .definitions import MAX_SUPPORTED_VERSION

MODULE_LOG = logging.getLogger(__name__)

ModuleTypes = Union[
    'TemperatureModuleContext',
    'MagneticModuleContext',
    'ThermocyclerContext'
]

AdvancedLiquidHandling = Union[
    Well,
    types.Location,
    List[Union[Well, types.Location]],
    List[List[Well]]]


class ProtocolContext(CommandPublisher):
    """ The Context class is a container for the state of a protocol.

    It encapsulates many of the methods formerly found in the Robot class,
    including labware, instrument, and module loading, as well as core
    functions like pause and resume.

    Unlike the old robot class, it is designed to be ephemeral. The lifetime
    of a particular instance should be about the same as the lifetime of a
    protocol. The only exception is the one stored in
    :py:attr:`.legacy_api.api.robot`, which is provided only for back
    compatibility and should be used less and less as time goes by.

    .. versionadded:: 2.0

    """

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None,
                 hardware: hc.API = None,
                 broker=None,
                 bundled_labware: Dict[str, LabwareDefinition] = None,
                 bundled_data: Dict[str, bytes] = None,
                 extra_labware: Dict[str, LabwareDefinition] = None,
                 api_version: APIVersion = None,
                 ) -> None:
        """ Build a :py:class:`.ProtocolContext`.

        :param loop: An event loop to use. If not specified, this ctor will
                     (eventually) call :py:meth:`asyncio.get_event_loop`.
        :param hardware: An optional hardware controller to link to. If not
                         specified, a new simulator will be created.
        :param broker: An optional command broker to link to. If not
                      specified, a dummy one is used.
        :param bundled_labware: A dict mapping labware URIs to definitions.
                                This is used when executing bundled protocols,
                                and if specified will be the only allowed
                                source for labware definitions, excluding the
                                built in definitions and anything in
                                ``extra_labware``.
        :param bundled_data: A dict mapping filenames to the contents of data
                             files. Can be used by the protocol, since it is
                             exposed as
                             :py:attr:`.ProtocolContext.bundled_data`
        :param extra_labware: A dict mapping labware URIs to definitions. These
                              URIs are searched during :py:meth:`.load_labware`
                              in addition to the system definitions (if
                              ``bundled_labware`` was not specified). Used to
                              provide custom labware definitions.
        :param api_version: The API version to use. If this is ``None``, uses
                            the max supported version.
        """
        super().__init__(broker)

        self._api_version = api_version or MAX_SUPPORTED_VERSION
        if self._api_version > MAX_SUPPORTED_VERSION:
            raise RuntimeError(
                f'API version {self._api_version} is not supported by this '
                f'robot software. Please either reduce your requested API '
                f'version or update your robot.')
        self._loop = loop or asyncio.get_event_loop()
        self._deck_layout = geometry.Deck()
        self._instruments: Dict[types.Mount, Optional[InstrumentContext]]\
            = {mount: None for mount in types.Mount}
        self._modules: Set[ModuleContext] = set()
        self._last_moved_instrument: Optional[types.Mount] = None
        self._location_cache: Optional[types.Location] = None

        self._hw_manager = HardwareManager(hardware)
        self._log = MODULE_LOG.getChild(self.__class__.__name__)
        self._commands: List[str] = []
        self._unsubscribe_commands = None
        self.clear_commands()

        self._bundled_labware = bundled_labware
        self._extra_labware = extra_labware or {}

        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._default_max_speeds = AxisMaxSpeeds()
        if fflags.short_fixed_trash():
            trash_name = 'opentrons_1_trash_850ml_fixed'
        else:
            trash_name = 'opentrons_1_trash_1100ml_fixed'
        if self._deck_layout['12']:
            del self._deck_layout['12']
        self.load_labware(trash_name, '12')

    @classmethod
    def build_using(cls,
                    protocol: Protocol,
                    *args, **kwargs):
        """ Build an API instance for the specified parsed protocol

        This is used internally to provision the context with bundle
        contents or api levels.
        """
        kwargs['bundled_data'] = getattr(protocol, 'bundled_data', None)
        kwargs['bundled_labware'] = getattr(protocol, 'bundled_labware', None)
        kwargs['api_version'] = getattr(
            protocol, 'api_level', MAX_SUPPORTED_VERSION)
        return cls(*args, **kwargs)

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        """ Return the API version supported by this protoocl context.

        The supported API version was specified when the protocol context
        was initialized. It may be lower than the highest version supported
        by the robot software. For the highest version supported by the
        robot software, see :py:attr:`.protocol_api.MAX_SUPPORTED_VERSION`.
        """
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def bundled_data(self) -> Dict[str, bytes]:
        """ Accessor for data files bundled with this protocol, if any.

        This is a dictionary mapping the filenames of bundled datafiles, with
        extensions but without paths (e.g. if a file is stored in the bundle as
        ``data/mydata/aspirations.csv`` it will be in the dict as
        ``'aspirations.csv'``) to the bytes contents of the files.
        """
        return self._bundled_data

    def __del__(self):
        if getattr(self, '_unsubscribe_commands', None):
            self._unsubscribe_commands()

    @property  # type: ignore
    @requires_version(2, 0)
    def max_speeds(self) -> AxisMaxSpeeds:
        """ Per-axis speed limits when moving this instrument.

        Changing this value changes the speed limit for each non-plunger
        axis of the robot, when moving this pipette. Note that this does
        only sets a limit on how fast movements can be; movements can
        still be slower than this. However, it is useful if you require
        the robot to move much more slowly than normal when using this
        pipette.

        This is a dictionary mapping string names of axes to float values
        limiting speeds. To change a speed, set that axis's value. To
        reset an axis's speed to default, delete the entry for that axis
        or assign it to ``None``.

        For instance,

        .. code-block:: py

            def run(protocol):
                protocol.comment(str(right.max_speeds))  # '{}' - all default
                protocol.max_speeds['A'] = 10  # limit max speed of
                                               # right pipette Z to 10mm/s
                del protocol.max_speeds['A']  # reset to default
                protocol.max_speeds['X'] = 10  # limit max speed of x to
                                               # 10 mm/s
                protocol.max_speeds['X'] = None  # reset to default

        """
        return self._default_max_speeds

    @requires_version(2, 0)
    def commands(self):
        return self._commands

    @requires_version(2, 0)
    def clear_commands(self):
        self._commands.clear()
        if self._unsubscribe_commands:
            self._unsubscribe_commands()

        def on_command(message):
            payload = message.get('payload')
            text = payload.get('text')
            if text is None:
                return

            if message['$'] == 'before':
                self._commands.append(text.format(**payload))

        self._unsubscribe_commands = self.broker.subscribe(
            cmds.types.COMMAND, on_command)

    @contextlib.contextmanager
    def temp_connect(self, hardware: hc.API):
        """ Connect temporarily to the specified hardware controller.

        This should be used as a context manager:

        .. code-block :: python

            with ctx.temp_connect(hw):
                # do some tasks
                ctx.home()
            # after the with block, the context is connected to the same
            # hardware control API it was connected to before, even if
            # an error occurred in the code inside the with block

        """
        old_hw = self._hw_manager.hardware
        old_tc = None
        tc_context = None
        try:
            self._hw_manager.set_hw(hardware)
            for mod_ctx in self._modules:
                if isinstance(mod_ctx, ThermocyclerContext):
                    tc_context = mod_ctx
                    hw_tc = next(hw_mod for hw_mod in
                                 hardware.attached_modules
                                 if hw_mod.name() == 'thermocycler')
                    if hw_tc:
                        old_tc = mod_ctx._module
                        mod_ctx._module = hw_tc
            yield self
        finally:
            self._hw_manager.set_hw(old_hw)
            if tc_context is not None and old_tc is not None:
                tc_context._module = old_tc

    @requires_version(2, 0)
    def connect(self, hardware: hc.API):
        """ Connect to a running hardware API.

        This can be either a simulator or a full hardware controller.

        Note that there is no true disconnected state for a
        :py:class:`.ProtocolContext`; :py:meth:`disconnect` simply creates
        a new simulator and replaces the current hardware with it.
        """
        self._hw_manager.set_hw(hardware)
        self._hw_manager.hardware.cache_instruments()

    @requires_version(2, 0)
    def disconnect(self):
        """ Disconnect from currently-connected hardware and simulate instead
        """
        self._hw_manager.reset_hw()

    @requires_version(2, 0)
    def is_simulating(self) -> bool:
        return self._hw_manager.hardware.get_is_simulator()

    @requires_version(2, 1)
    def set_acceleration(self, settings=None):
        self._hw_manager.hardware.set_acceleration(settings)

    @requires_version(2, 0)
    def load_labware_from_definition(
            self,
            labware_def: LabwareDefinition,
            location: types.DeckLocation,
            label: str = None,
    ) -> Labware:
        """ Specify the presence of a piece of labware on the OT2 deck.

        This function loads the labware definition specified by `labware_def`
        to the location specified by `location`.

        :param labware_def: The labware definition to load
        :param location: The slot into which to load the labware such as
                         1 or '1'
        :type location: int or str
        :param str label: An optional special name to give the labware. If
                          specified, this is the name the labware will appear
                          as in the run log and the calibration view in the
                          Opentrons app.
        """
        parent = self.deck.position_for(location)
        labware_obj = load_from_definition(labware_def, parent, label)
        self._deck_layout[location] = labware_obj
        return labware_obj

    @requires_version(2, 0)
    def load_labware(
            self,
            load_name: str,
            location: types.DeckLocation,
            label: str = None,
            namespace: str = None,
            version: int = None,
    ) -> Labware:
        """ Load a labware onto the deck given its name.

        For labware already defined by Opentrons, this is a convenient way
        to collapse the two stages of labware initialization (creating
        the labware and adding it to the protocol) into one.

        This function returns the created and initialized labware for use
        later in the protocol.

        :param load_name: A string to use for looking up a labware definition
        :param location: The slot into which to load the labware such as
                         1 or '1'
        :type location: int or str
        :param str label: An optional special name to give the labware. If
                          specified, this is the name the labware will appear
                          as in the run log and the calibration view in the
                          Opentrons app.
        :param str namespace: The namespace the labware definition belongs to.
            If unspecified, will search 'opentrons' then 'custom_beta'
        :param int version: The version of the labware definition. If
            unspecified, will use version 1.
        """
        labware_def = get_labware_definition(
            load_name, namespace, version,
            bundled_defs=self._bundled_labware,
            extra_defs=self._extra_labware)
        return self.load_labware_from_definition(
            labware_def, location, label)

    @requires_version(2, 0)
    def load_labware_by_name(
            self,
            load_name: str,
            location: types.DeckLocation,
            label: str = None,
            namespace: str = None,
            version: int = 1
    ) -> Labware:
        MODULE_LOG.warning(
            'load_labware_by_name is deprecated and will be removed in '
            'version 3.12.0. please use load_labware')
        return self.load_labware(
            load_name, location, label, namespace, version)

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_labwares(self) -> Dict[int, Union[Labware, ModuleGeometry]]:
        """ Get the labwares that have been loaded into the protocol context.

        Slots with nothing in them will not be present in the return value.

        .. note::

            If a module is present on the deck but no labware has been loaded
            into it with :py:meth:`.ModuleContext.load_labware`, there will
            be no entry for that slot in this value. That means you should not
            use ``loaded_labwares`` to determine if a slot is available or not,
            only to get a list of labwares. If you want a data structure of all
            objects on the deck regardless of type, see :py:attr:`deck`.


        :returns: Dict mapping deck slot number to labware, sorted in order of
                  the locations.
        """
        def _only_labwares() -> Iterator[
                Tuple[int, Union[Labware, ModuleGeometry]]]:
            for slotnum, slotitem in self._deck_layout.items():
                if isinstance(slotitem, Labware):
                    yield slotnum, slotitem
                elif isinstance(slotitem, ModuleGeometry):
                    if slotitem.labware:
                        yield slotnum, slotitem.labware

        return dict(_only_labwares())

    @requires_version(2, 0)
    def load_module(
            self, module_name: str,
            location: Optional[types.DeckLocation] = None) -> ModuleTypes:
        """ Load a module onto the deck given its name.

        This is the function to call to use a module in your protocol, like
        :py:meth:`load_instrument` is the method to call to use an instrument
        in your protocol. It returns the created and initialized module
        context, which will be a different class depending on the kind of
        module loaded.

        A map of deck positions to loaded modules can be accessed later
        using :py:attr:`loaded_modules`.

        :param str module_name: The name of the module.
        :param location: The location of the module. This is usually the
                         name or number of the slot on the deck where you
                         will be placing the module. Some modules, like
                         the Thermocycler, are only valid in one deck
                         location. You do not have to specify a location
                         when loading a Thermocycler - it will always be
                         in Slot 7.
        :type location: str or int or None
        :returns ModuleContext: The loaded and initialized
                                :py:class:`ModuleContext`.
        """
        resolved_name = ModuleGeometry.resolve_module_name(module_name)
        resolved_location = self._deck_layout.resolve_module_location(
                resolved_name, location)
        geometry = load_module(resolved_name,
                               self._deck_layout.position_for(
                                    resolved_location))
        hc_mod_instance = None
        hw = self._hw_manager.hardware._api._backend
        mod_class = {
            'magdeck': MagneticModuleContext,
            'tempdeck': TemperatureModuleContext,
            'thermocycler': ThermocyclerContext}[resolved_name]
        for mod in self._hw_manager.hardware.attached_modules:
            if mod.name() == resolved_name:
                hc_mod_instance = adapters.SynchronousAdapter(mod)
                break

        if isinstance(hw, Simulator) and hc_mod_instance is None:
            mod_type = {
                'magdeck': modules.magdeck.MagDeck,
                'tempdeck': modules.tempdeck.TempDeck,
                'thermocycler': modules.thermocycler.Thermocycler
                }[resolved_name]
            hc_mod_instance = adapters.SynchronousAdapter(mod_type(
                port='', simulating=True, loop=self._loop))
        if hc_mod_instance:
            mod_ctx = mod_class(self,
                                hc_mod_instance,
                                geometry,
                                self.api_version,
                                self._loop)
        else:
            raise RuntimeError(
                f'Could not find specified module: {resolved_name}')
        self._modules.add(mod_ctx)
        self._deck_layout[resolved_location] = geometry
        return mod_ctx

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_modules(self) -> Dict[int, 'ModuleContext']:
        """ Get the modules loaded into the protocol context.

        This is a map of deck positions to modules loaded by previous calls
        to :py:meth:`load_module`. It is not necessarily the same as the
        modules attached to the robot - for instance, if the robot has a
        Magnetic Module and a Temperature Module attached, but the protocol
        has only loaded the Temperature Module with :py:meth:`load_module`,
        only the Temperature Module will be present.

        :returns Dict[str, ModuleContext]: Dict mapping slot name to module
                                           contexts. The elements may not be
                                           ordered by slot number.
        """
        def _modules() -> Iterator[Tuple[int, 'ModuleContext']]:
            for module in self._modules:
                yield int(module.geometry.parent), module

        return dict(_modules())

    @requires_version(2, 0)
    def load_instrument(
            self,
            instrument_name: str,
            mount: Union[types.Mount, str],
            tip_racks: List[Labware] = None,
            replace: bool = False) -> 'InstrumentContext':
        """ Load a specific instrument required by the protocol.

        This value will actually be checked when the protocol runs, to
        ensure that the correct instrument is attached in the specified
        location.

        :param str instrument_name: The name of the instrument model, or a
                                    prefix. For instance, 'p10_single' may be
                                    used to request a P10 single regardless of
                                    the version.
        :param mount: The mount in which this instrument should be attached.
                      This can either be an instance of the enum type
                      :py:class:`.types.Mount` or one of the strings `'left'`
                      and `'right'`.
        :type mount: types.Mount or str
        :param tip_racks: A list of tip racks from which to pick tips if
                          :py:meth:`.InstrumentContext.pick_up_tip` is called
                          without arguments.
        :type tip_racks: List[:py:class:`.Labware`]
        :param bool replace: Indicate that the currently-loaded instrument in
                             `mount` (if such an instrument exists) should be
                             replaced by `instrument_name`.
        """
        if isinstance(mount, str):
            try:
                checked_mount = types.Mount[mount.upper()]
            except KeyError:
                raise ValueError(
                    "If mount is specified as a string, it should be either"
                    "'left' or 'right' (ignoring capitalization, which the"
                    " system strips), not {}".format(mount))
        elif isinstance(mount, types.Mount):
            checked_mount = mount
        else:
            raise TypeError(
                "mount should be either an instance of opentrons.types.Mount"
                " or a string, but is {}.".format(mount))
        self._log.info("Trying to load {} on {} mount"
                       .format(instrument_name, checked_mount.name.lower()))
        instr = self._instruments[checked_mount]
        if instr and not replace:
            raise RuntimeError("Instrument already present in {} mount: {}"
                               .format(checked_mount.name.lower(),
                                       instr.name))
        attached = {att_mount: instr.get('model', None)
                    for att_mount, instr
                    in self._hw_manager.hardware.attached_instruments.items()}
        attached[checked_mount] = instrument_name
        self._log.debug("cache instruments expectation: {}"
                        .format(attached))
        self._hw_manager.hardware.cache_instruments(attached)
        # If the cache call didn’t raise, the instrument is attached
        new_instr = InstrumentContext(
            ctx=self,
            hardware_mgr=self._hw_manager,
            mount=checked_mount,
            at_version=self._api_version,
            tip_racks=tip_racks,
            log_parent=self._log,
            requested_as=instrument_name)
        self._instruments[checked_mount] = new_instr
        self._log.info("Instrument {} loaded".format(new_instr))
        return new_instr

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_instruments(self) -> Dict[str, Optional['InstrumentContext']]:
        """ Get the instruments that have been loaded into the protocol.

        This is a map of mount name to instruments previously loaded with
        :py:meth:`load_instrument`. It is not necessarily the same as the
        instruments attached to the robot - for instance, if the robot has
        an instrument in both mounts but your protocol has only loaded one
        of them with :py:meth:`load_instrument`, the unused one will not
        be present.

        :returns: A dict mapping mount names in lowercase to the instrument
                  in that mount. If no instrument is loaded in the mount,
                  it will not be present
        """
        return {mount.name.lower(): instr for mount, instr
                in self._instruments.items()
                if instr}

    @cmds.publish.both(command=cmds.pause)
    @requires_version(2, 0)
    def pause(self, msg=None):
        """ Pause execution of the protocol until resume is called.

        This function returns immediately, but the next function call that
        is blocked by a paused robot (anything that involves moving) will
        not return until :py:meth:`resume` is called.

        :param str msg: A message to echo back to connected clients.
        """
        self._hw_manager.hardware.pause()

    @cmds.publish.both(command=cmds.resume)
    @requires_version(2, 0)
    def resume(self):
        """ Resume a previously-paused protocol """
        self._hw_manager.hardware.resume()

    @cmds.publish.both(command=cmds.comment)
    @requires_version(2, 0)
    def comment(self, msg):
        """
        Add a user-readable comment string that will be echoed to the Opentrons
        app.
        """
        pass

    @cmds.publish.both(command=cmds.delay)
    @requires_version(2, 0)
    def delay(self, seconds=0, minutes=0, msg=None):
        """ Delay protocol execution for a specific amount of time.

        :param float seconds: A time to delay in seconds
        :param float minutes: A time to delay in minutes

        If both `seconds` and `minutes` are specified, they will be added.
        """
        delay_time = seconds + minutes * 60
        self._hw_manager.hardware.delay(delay_time)

    @requires_version(2, 0)
    def home(self):
        """ Homes the robot.
        """
        self._log.debug("home")
        self._location_cache = None
        self._hw_manager.hardware.home()

    @property
    def location_cache(self) -> Optional[types.Location]:
        """ The cache used by the robot to determine where it last was.
        """
        return self._location_cache

    @location_cache.setter
    def location_cache(self, loc: Optional[types.Location]):
        self._location_cache = loc

    @property  # type: ignore
    @requires_version(2, 0)
    def deck(self) -> geometry.Deck:
        """ The object holding the deck layout of the robot.

        This object behaves like a dictionary with keys for both numeric
        and string slot numbers (for instance, ``protocol.deck[1]`` and
        ``protocol.deck['1']`` will both return the object in slot 1). If
        nothing is loaded into a slot, ``None`` will be present. This object
        is useful for determining if a slot in the deck is free. Rather than
        filtering the objects in the deck map yourself, you can also use
        :py:attr:`loaded_labwares` to see a dict of labwares and
        :py:attr:`loaded_modules` to see a dict of modules.
        """
        return self._deck_layout

    @property  # type: ignore
    @requires_version(2, 0)
    def fixed_trash(self) -> Labware:
        """ The trash fixed to slot 12 of the robot deck. """
        trash = self._deck_layout['12']
        if not trash:
            raise RuntimeError("Robot must have a trash container in 12")
        return trash  # type: ignore


class InstrumentContext(CommandPublisher):
    """ A context for a specific pipette or instrument.

    This can be used to call methods related to pipettes - moves or
    aspirates or dispenses, or higher-level methods.

    Instances of this class bundle up state and config changes to a
    pipette - for instance, changes to flow rates or trash containers.
    Action methods (like :py:meth:`aspirate` or :py:meth:`distribute`) are
    defined here for convenience.

    In general, this class should not be instantiated directly; rather,
    instances are returned from :py:meth:`ProtcolContext.load_instrument`.

    .. versionadded:: 2.0

    """

    def __init__(self,
                 ctx: ProtocolContext,
                 hardware_mgr: HardwareManager,
                 mount: types.Mount,
                 log_parent: logging.Logger,
                 at_version: APIVersion,
                 tip_racks: List[Labware] = None,
                 trash: Labware = None,
                 default_speed: float = 400.0,
                 requested_as: str = None,
                 **config_kwargs) -> None:

        super().__init__(ctx.broker)
        self._api_version = at_version
        self._hw_manager = hardware_mgr
        self._ctx = ctx
        self._mount = mount

        self._tip_racks = tip_racks or list()
        for tip_rack in self.tip_racks:
            assert tip_rack.is_tiprack
        if trash is None:
            self.trash_container = self._ctx.fixed_trash
        else:
            self.trash_container = trash

        self._default_speed = default_speed

        self._last_location: Union[Labware, Well, None] = None
        self._last_tip_picked_up_from: Union[Well, None] = None
        self._log = log_parent.getChild(repr(self))
        self._log.info("attached")
        self._well_bottom_clearance = Clearances(
            default_aspirate=1.0, default_dispense=1.0)
        self._flow_rates = FlowRates(self)
        self._speeds = PlungerSpeeds(self)
        self._starting_tip: Union[Well, None] = None
        self.requested_as = requested_as

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def starting_tip(self) -> Union[Well, None]:
        """ The starting tip from which the pipette pick up
        """
        return self._starting_tip

    @starting_tip.setter
    def starting_tip(self, location: Union[Well, None]):
        self._starting_tip = location

    @requires_version(2, 0)
    def reset_tipracks(self):
        """ Reload all tips in each tip rack and reset starting tip
        """
        for tiprack in self.tip_racks:
            tiprack.reset()
        self.starting_tip = None

    @property  # type: ignore
    @requires_version(2, 0)
    def default_speed(self) -> float:
        """ The speed at which the robot's gantry moves.

        By default, 400 mm/s. Changing this value will change the speed of the
        pipette when moving between labware. In addition to changing the
        default, the speed of individual motions can be changed with the
        ``speed`` argument to :py:meth:`InstrumentContext.move_to`.
        """
        return self._default_speed

    @default_speed.setter
    def default_speed(self, speed: float):
        self._default_speed = speed

    @requires_version(2, 0)
    def aspirate(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the specified location

        If only a volume is passed, the pipette will aspirate
        from its current position. If only a location is passed (as in
        ``instr.aspirate(location=wellplate['A1'])``,
        :py:meth:`aspirate` will default to the amount of volume available.

        :param volume: The volume to aspirate, in microliters. If not
                       specified, :py:attr:`max_volume`.
        :type volume: int or float
        :param location: Where to aspirate from. If `location` is a
                         :py:class:`.Well`, the robot will aspirate from
                         :py:attr:`well_bottom_clearance```.aspirate`` mm
                         above the bottom of the well. If `location` is a
                         :py:class:`.Location` (i.e. the result of
                         :py:meth:`.Well.top` or :py:meth:`.Well.bottom`), the
                         robot will aspirate from the exact specified location.
                         If unspecified, the robot will aspirate from the
                         current position.
        :param rate: The relative plunger speed for this aspirate. During
                     this aspirate, the speed of the plunger will be
                     `rate` * :py:attr:`aspirate_speed`. If not specified,
                     defaults to 1.0 (speed will not be modified).
        :type rate: float
        :returns: This instance.

        .. note::

            If ``aspirate`` is called with a single argument, it will not try
            to guess whether the argument is a volume or location - it is
            required to be a volume. If you want to call ``aspirate`` with only
            a location, specify it as a keyword argument:
            ``instr.aspirate(location=wellplate['A1'])``

        """
        self._log.debug("aspirate {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))

        if isinstance(location, Well):
            point, well = location.bottom()
            dest = types.Location(
                point + types.Point(0, 0,
                                    self.well_bottom_clearance.aspirate),
                well)
        elif isinstance(location, types.Location):
            dest = location
        elif location is not None:
            raise TypeError(
                'location should be a Well or Location, but it is {}'
                .format(location))
        elif self._ctx.location_cache:
            dest = self._ctx.location_cache
        else:
            raise RuntimeError(
                "If aspirate is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")

        if self.current_volume == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration
            if isinstance(dest.labware, Well):
                self.move_to(dest.labware.top())
            else:
                # TODO(seth,2019/7/29): This should be a warning exposed via
                # rpc to the runapp
                self._log.warning(
                    "When aspirate is called on something other than a well"
                    " relative position, we can't move to the top of the well"
                    " to prepare for aspiration. This might cause over "
                    " aspiration if the previous command is a blow_out.")
            self._hw_manager.hardware.prepare_for_aspirate(self._mount)
            self.move_to(dest)
        elif dest != self._ctx.location_cache:
            self.move_to(dest)

        cmds.do_publish(self.broker, cmds.aspirate, self.aspirate,
                        'before', None, None, self, volume, dest, rate)
        self._hw_manager.hardware.aspirate(self._mount, volume, rate)
        cmds.do_publish(self.broker, cmds.aspirate, self.aspirate,
                        'after', self, None, self, volume, dest, rate)
        return self

    @requires_version(2, 0)
    def dispense(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location.

        If only a volume is passed, the pipette will dispense from its current
        position. If only a location is passed (as in
        ``instr.dispense(location=wellplate['A1'])``), all of the liquid
        aspirated into the pipette will be dispensed (this volume is accessible
        through :py:attr:`current_volume`).

        :param volume: The volume of liquid to dispense, in microliters. If not
                       specified, defaults to :py:attr:`current_volume`.
        :type volume: int or float

        :param location: Where to dispense into. If `location` is a
                         :py:class:`.Well`, the robot will dispense into
                         :py:attr:`well_bottom_clearance```.dispense`` mm
                         above the bottom of the well. If `location` is a
                         :py:class:`.Location` (i.e. the result of
                         :py:meth:`.Well.top` or :py:meth:`.Well.bottom`), the
                         robot will dispense into the exact specified location.
                         If unspecified, the robot will dispense into the
                         current position.
        :param rate: The relative plunger speed for this dispense. During
                     this dispense, the speed of the plunger will be
                     `rate` * :py:attr:`dispense_speed`. If not specified,
                     defaults to 1.0 (speed will not be modified).
        :type rate: float

        :returns: This instance.

        .. note::

            If ``dispense`` is called with a single argument, it will not try
            to guess whether the argument is a volume or location - it is
            required to be a volume. If you want to call ``dispense`` with only
            a location, specify it as a keyword argument:
            ``instr.dispense(location=wellplate['A1'])``

        """
        self._log.debug("dispense {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))
        if isinstance(location, Well):
            if 'fixedTrash' in quirks_from_any_parent(location):
                loc = location.top()
            else:
                point, well = location.bottom()
                loc = types.Location(
                    point + types.Point(0, 0,
                                        self.well_bottom_clearance.dispense),
                    well)
            self.move_to(loc)
        elif isinstance(location, types.Location):
            loc = location
            self.move_to(location)
        elif location is not None:
            raise TypeError(
                'location should be a Well or Location, but it is {}'
                .format(location))
        elif self._ctx.location_cache:
            loc = self._ctx.location_cache
        else:
            raise RuntimeError(
                "If dispense is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "aspirate) must previously have been called so the robot "
                "knows where it is.")
        cmds.do_publish(self.broker, cmds.dispense, self.dispense,
                        'before', None, None, self, volume, loc, rate)
        self._hw_manager.hardware.dispense(self._mount, volume, rate)
        cmds.do_publish(self.broker, cmds.dispense, self.dispense,
                        'after', self, None, self, volume, loc, rate)
        return self

    @cmds.publish.both(command=cmds.mix)
    @requires_version(2, 0)
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> 'InstrumentContext':
        """
        Mix a volume of liquid (uL) using this pipette.
        If no location is specified, the pipette will mix from its current
        position. If no volume is passed, ``mix`` will default to the
        pipette's :py:attr:`max_volume`.

        :param repetitions: how many times the pipette should mix (default: 1)
        :param volume: number of microliters to mix (default:
                       :py:attr:`max_volume`)
        :param location: a Well or a position relative to well.
                         e.g, `plate.rows()[0][0].bottom()`
        :type location: types.Location
        :param rate: Set plunger speed for this mix, where,
                     ``speed = rate * (aspirate_speed or dispense_speed)``
        :raises NoTipAttachedError: If no tip is attached to the pipette.
        :returns: This instance

        .. note::

            All the arguments to ``mix`` are optional; however, if you do
            not want to specify one of them, all arguments after that one
            should be keyword arguments. For instance, if you do not want
            to specify volume, you would call
            ``pipette.mix(1, location=wellplate['A1'])``. If you do not
            want to specify repetitions, you would call
            ``pipette.mix(volume=10, location=wellplate['A1'])``. Unlike
            previous API versions, ``mix`` will not attempt to guess your
            inputs; the first argument will always be interpreted as
            ``repetitions``, the second as ``volume``, and the third as
            ``location`` unless you use keywords.

        """
        self._log.debug(
            'mixing {}uL with {} repetitions in {} at rate={}'.format(
                volume, repetitions,
                location if location else 'current position', rate))
        if not self.hw_pipette['has_tip']:
            raise hc.NoTipAttachedError('Pipette has no tip. Aborting mix()')

        self.aspirate(volume, location, rate)
        while repetitions - 1 > 0:
            self.dispense(volume, rate=rate)
            self.aspirate(volume, rate=rate)
            repetitions -= 1
        self.dispense(volume, rate=rate)
        return self

    @cmds.publish.both(command=cmds.blow_out)
    @requires_version(2, 0)
    def blow_out(self,
                 location: Union[types.Location, Well] = None
                 ) -> 'InstrumentContext':
        """
        Blow liquid out of the tip.

        If :py:attr:`dispense` is used to completely empty a pipette,
        usually a small amount of liquid will remain in the tip. This
        method moves the plunger past its usual stops to fully remove
        any remaining liquid from the tip. Regardless of how much liquid
        was in the tip when this function is called, after it is done
        the tip will be empty.

        :param location: The location to blow out into. If not specified,
                         defaults to the current location of the pipette
        :type location: :py:class:`.Well` or :py:class:`.Location` or None

        :raises RuntimeError: If no location is specified and location cache is
                              None. This should happen if `blow_out` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)
        :returns: This instance
        """

        if isinstance(location, Well):
            if location.parent.is_tiprack:
                self._log.warning('Blow_out being performed on a tiprack. '
                                  'Please re-check your code')
            loc = location.top()
            self.move_to(loc)
        elif isinstance(location, types.Location):
            loc = location
            self.move_to(loc)
        elif location is not None:
            raise TypeError(
                'location should be a Well or Location, but it is {}'
                .format(location))
        elif self._ctx.location_cache:
            # if location cache exists, pipette blows out immediately at
            # current location, no movement is needed
            pass
        else:
            raise RuntimeError(
                "If blow out is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")
        self._hw_manager.hardware.blow_out(self._mount)
        return self

    @cmds.publish.both(command=cmds.touch_tip)
    @requires_version(2, 0)
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'InstrumentContext':
        """
        Touch the pipette tip to the sides of a well, with the intent of
        removing left-over droplets

        :param location: If no location is passed, pipette will
                         touch tip at current well's edges
        :type location: :py:class:`.Well` or None
        :param radius: Describes the proportion of the target well's
                       radius. When `radius=1.0`, the pipette tip will move to
                       the edge of the target well; when `radius=0.5`, it will
                       move to 50% of the well's radius. Default: 1.0 (100%)
        :type radius: float
        :param v_offset: The offset in mm from the top of the well to touch tip
                         A positive offset moves the tip higher above the well,
                         while a negative offset moves it lower into the well
                         Default: -1.0 mm
        :type v_offset: float
        :param speed: The speed for touch tip motion, in mm/s.
                      Default: 60.0 mm/s, Max: 80.0 mm/s, Min: 20.0 mm/s
        :type speed: float
        :raises NoTipAttachedError: if no tip is attached to the pipette
        :raises RuntimeError: If no location is specified and location cache is
                              None. This should happen if `touch_tip` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)
        :returns: This instance

        .. note::

            This is behavior change from legacy API (which accepts any
            :py:class:`.Placeable` as the ``location`` parameter)

        """
        if not self.hw_pipette['has_tip']:
            raise hc.NoTipAttachedError('Pipette has no tip to touch_tip()')

        def _build_edges(where: Well, offset: float) -> List[types.Point]:
            # Determine the touch_tip edges/points
            offset_pt = types.Point(0, 0, offset)
            return [
                # right edge
                where._from_center_cartesian(x=radius, y=0, z=1) + offset_pt,
                # left edge
                where._from_center_cartesian(x=-radius, y=0, z=1) + offset_pt,
                # back edge
                where._from_center_cartesian(x=0, y=radius, z=1) + offset_pt,
                # front edge
                where._from_center_cartesian(x=0, y=-radius, z=1) + offset_pt
            ]

        checked_speed = clamp_value(speed, 80, 20, 'touch_tip:')

        # If location is a valid well, move to the well first
        if location is None:
            if not self._ctx.location_cache:
                raise RuntimeError('No valid current location cache present')
            else:
                location = self._ctx.location_cache.labware  # type: ignore
                # type checked below

        if isinstance(location, Well):
            if 'touchTipDisabled' in quirks_from_any_parent(location):
                self._log.info(f"Ignoring touch tip on labware {location}")
                return self
            if location.parent.is_tiprack:
                self._log.warning('Touch_tip being performed on a tiprack. '
                                  'Please re-check your code')
            self.move_to(location.top())
        else:
            raise TypeError(
                'location should be a Well, but it is {}'.format(location))

        for edge in _build_edges(location, v_offset):
            self._hw_manager.hardware.move_to(self._mount, edge, checked_speed)
        return self

    @cmds.publish.both(command=cmds.air_gap)
    @requires_version(2, 0)
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'InstrumentContext':
        """
        Pull air into the pipette current tip at the current location

        :param volume: The amount in uL to aspirate air into the tube.
                       (Default will use all remaining volume in tip)
        :type volume: float

        :param height: The number of millimiters to move above the current Well
                       to air-gap aspirate. (Default: 5mm above current Well)
        :type height: float

        :raises NoTipAttachedError: If no tip is attached to the pipette

        :raises RuntimeError: If location cache is None.
                              This should happen if `touch_tip` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)

        :returns: This instance

        .. note::

            Both ``volume`` and height are optional, but unlike previous API
            versions, if you want to specify only ``height`` you must do it
            as a keyword argument: ``pipette.air_gap(height=2)``. If you
            call ``air_gap`` with only one unnamed argument, it will always
            be interpreted as a volume.


        """
        if not self.hw_pipette['has_tip']:
            raise hc.NoTipAttachedError('Pipette has no tip. Aborting air_gap')

        if height is None:
            height = 5
        loc = self._ctx.location_cache
        if not loc or not isinstance(loc.labware, Well):
            raise RuntimeError('No previous Well cached to perform air gap')
        target = loc.labware.top(height)
        self.move_to(target)
        self.aspirate(volume)
        return self

    @cmds.publish.both(command=cmds.return_tip)
    @requires_version(2, 0)
    def return_tip(self, home_after: bool = True) -> 'InstrumentContext':
        """
        If a tip is currently attached to the pipette, then it will return the
        tip to it's location in the tiprack.

        It will not reset tip tracking so the well flag will remain False.

        :returns: This instance
        """
        if not self.hw_pipette['has_tip']:
            self._log.warning('Pipette has no tip to return')
        loc = self._last_tip_picked_up_from
        if not isinstance(loc, Well):
            raise TypeError('Last tip location should be a Well but it is: '
                            '{}'.format(loc))
        bot = loc.bottom()
        bot = bot._replace(point=bot.point._replace(z=bot.point.z + 10))
        self.drop_tip(bot, home_after=home_after)

        return self

    def _next_available_tip(self) -> Tuple[Labware, Well]:
        start = self.starting_tip
        if start is None:
            return select_tiprack_from_list(
                self.tip_racks, self.channels)
        else:
            return select_tiprack_from_list(
                filter_tipracks_to_start(start, self.tip_racks),
                self.channels, start)

    @requires_version(2, 0)
    def pick_up_tip(  # noqa(C901)
            self, location: Union[types.Location, Well] = None,
            presses: int = None,
            increment: float = None) -> 'InstrumentContext':
        """
        Pick up a tip for the pipette to run liquid-handling commands with

        If no location is passed, the Pipette will pick up the next available
        tip in its :py:attr:`InstrumentContext.tip_racks` list.

        The tip to pick up can be manually specified with the `location`
        argument. The `location` argument can be specified in several ways:

        * If the only thing to specify is which well from which to pick
          up a tip, `location` can be a :py:class:`.Well`. For instance,
          if you have a tip rack in a variable called `tiprack`, you can
          pick up a specific tip from it with
          ``instr.pick_up_tip(tiprack.wells()[0])``. This style of call can
          be used to make the robot pick up a tip from a tip rack that
          was not specified when creating the :py:class:`.InstrumentContext`.

        * If the position to move to in the well needs to be specified,
          for instance to tell the robot to run its pick up tip routine
          starting closer to or farther from the top of the tip,
          `location` can be a :py:class:`.types.Location`; for instance,
          you can call ``instr.pick_up_tip(tiprack.wells()[0].top())``.

        :param location: The location from which to pick up a tip.
        :type location: :py:class:`.types.Location` or :py:class:`.Well` to
                        pick up a tip from.
        :param presses: The number of times to lower and then raise the pipette
                        when picking up a tip, to ensure a good seal (0 [zero]
                        will result in the pipette hovering over the tip but
                        not picking it up--generally not desireable, but could
                        be used for dry-run).
        :type presses: int
        :param increment: The additional distance to travel on each successive
                          press (e.g.: if `presses=3` and `increment=1.0`, then
                          the first press will travel down into the tip by
                          3.5mm, the second by 4.5mm, and the third by 5.5mm).
        :type increment: float

        :returns: This instance
        """
        if location and isinstance(location, types.Location):
            if isinstance(location.labware, Labware):
                tiprack = location.labware
                target: Well = tiprack.next_tip(self.channels)  # type: ignore
                if not target:
                    raise OutOfTipsError
            elif isinstance(location.labware, Well):
                tiprack = location.labware.parent
                target = location.labware
        elif location and isinstance(location, Well):
            tiprack = location.parent
            target = location
        elif not location:
            tiprack, target = self._next_available_tip()
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))

        assert tiprack.is_tiprack, "{} is not a tiprack".format(str(tiprack))
        cmds.do_publish(self.broker, cmds.pick_up_tip, self.pick_up_tip,
                        'before', None, None, self, location=target)
        self.move_to(target.top())

        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._mount, target.diameter)
        self._hw_manager.hardware.pick_up_tip(
            self._mount, self._tip_length_for(tiprack), presses, increment)
        # Note that the hardware API pick_up_tip action includes homing z after
        cmds.do_publish(self.broker, cmds.pick_up_tip, self.pick_up_tip,
                        'after', self, None, self, location=target)
        self._hw_manager.hardware.set_working_volume(
            self._mount, target.max_volume)
        tiprack.use_tips(target, self.channels)
        self._last_tip_picked_up_from = target

        return self

    @requires_version(2, 0)
    def drop_tip(  # noqa(C901)
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True)\
            -> 'InstrumentContext':
        """
        Drop the current tip.

        If no location is passed, the Pipette will drop the tip into its
        :py:attr:`trash_container`, which if not specified defaults to
        the fixed trash in slot 12.

        The location in which to drop the tip can be manually specified with
        the `location` argument. The `location` argument can be specified in
        several ways:

            - If the only thing to specify is which well into which to drop
              a tip, `location` can be a :py:class:`.Well`. For instance,
              if you have a tip rack in a variable called `tiprack`, you can
              drop a tip into a specific well on that tiprack with the call
              `instr.drop_tip(tiprack.wells()[0])`. This style of call can
              be used to make the robot drop a tip into arbitrary labware.
            - If the position to drop the tip from as well as the
              :py:class:`.Well` to drop the tip into needs to be specified,
              for instance to tell the robot to drop a tip from an unusually
              large height above the tiprack, `location`
              can be a :py:class:`.types.Location`; for instance, you can call
              `instr.drop_tip(tiprack.wells()[0].top())`.

        .. note::

            OT1 required homing the plunger after dropping tips, so the prior
            version of `drop_tip` automatically homed the plunger. This is no
            longer needed in OT2. If you need to home the plunger, use
            :py:meth:`home_plunger`.

        :param location: The location to drop the tip
        :type location: :py:class:`.types.Location` or :py:class:`.Well` or
                        None

        :returns: This instance
        """
        if location and isinstance(location, types.Location):
            if isinstance(location.labware, Well):
                target = location
            else:
                raise TypeError(
                    "If a location is specified as a types.Location (for "
                    "instance, as the result of a call to "
                    "tiprack.wells()[0].top()) it must be a location "
                    "relative to a well, since that is where a tip is "
                    "dropped. The passed location, however, is in "
                    "reference to {}".format(location.labware))
        elif location and isinstance(location, Well):
            if 'fixedTrash' in quirks_from_any_parent(location):
                target = location.top()
            else:
                bot = location.bottom()
                target = bot._replace(
                    point=bot.point._replace(z=bot.point.z + 10))
        elif not location:
            target = self.trash_container.wells()[0].top()
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))
        cmds.do_publish(self.broker, cmds.drop_tip, self.drop_tip,
                        'before', None, None, self, location=target)
        self.move_to(target)
        self._hw_manager.hardware.drop_tip(self._mount, home_after=home_after)
        cmds.do_publish(self.broker, cmds.drop_tip, self.drop_tip,
                        'after', self, None, self, location=target)
        if isinstance(target.labware, Well)\
           and target.labware.parent.is_tiprack:
            # If this is a tiprack we can try and add the tip back to the
            # tracker
            try:
                target.labware.parent.return_tips(
                    target.labware, self.channels)
            except AssertionError:
                # Similarly to :py:meth:`return_tips`, the failure case here
                # just means the tip can't be reused, so don't actually stop
                # the protocol
                self._log.exception(f'Could not return tip to {target}')
        self._last_tip_picked_up_from = None
        return self

    @requires_version(2, 0)
    def home(self) -> 'InstrumentContext':
        """ Home the robot.

        :returns: This instance.
        """
        def home_dummy(mount): pass
        cmds.do_publish(self.broker, cmds.home, home_dummy,
                        'before', None, None, self._mount.name.lower())
        self._hw_manager.hardware.home_z(self._mount)
        self._hw_manager.hardware.home_plunger(self._mount)
        cmds.do_publish(self.broker, cmds.home, home_dummy,
                        'after', self, None, self._mount.name.lower())
        return self

    @requires_version(2, 0)
    def home_plunger(self) -> 'InstrumentContext':
        """ Home the plunger associated with this mount

        :returns: This instance.
        """
        self._hw_manager.hardware.home_plunger(self.mount)
        return self

    @cmds.publish.both(command=cmds.distribute)
    @requires_version(2, 0)
    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: List[Well],
                   *args, **kwargs) -> 'InstrumentContext':
        """
        Move a volume of liquid from one source to multiple destinations.

        :param volume: The amount of volume to distribute to each destination
                       well.
        :param source: A single well from where liquid will be aspirated.
        :param dest: List of Wells where liquid will be dispensed to.
        :param kwargs: See :py:meth:`transfer`. Some arguments are changed.
                       Specifically, ``mix_after``, if specified, is ignored
                       and ``disposal_volume``, if not specified, is set to the
                       minimum volume of the pipette
        :returns: This instance
        """
        self._log.debug("Distributing {} from {} to {}"
                        .format(volume, source, dest))
        kwargs['mode'] = 'distribute'
        kwargs['disposal_volume'] = kwargs.get(
            'disposal_volume', self.min_volume)
        kwargs['mix_after'] = (0, 0)
        return self.transfer(volume, source, dest, **kwargs)

    @cmds.publish.both(command=cmds.consolidate)
    @requires_version(2, 0)
    def consolidate(self,
                    volume: float,
                    source: List[Well],
                    dest: Well,
                    *args, **kwargs) -> 'InstrumentContext':
        """
        Move liquid from multiple wells (sources) to a single well(destination)

        :param volume: The amount of volume to consolidate from each source
                       well.
        :param source: List of wells from where liquid will be aspirated.
        :param dest: The single well into which liquid will be dispensed.
        :param kwargs: See :py:meth:`transfer`. Some arguments are changed.
                       Specifically, ``mix_before``, if specified, is ignored
                       and ``disposal_volume`` is ignored and set to 0.
        :returns: This instance
        """
        self._log.debug("Consolidate {} from {} to {}"
                        .format(volume, source, dest))
        kwargs['mode'] = 'consolidate'
        kwargs['mix_before'] = (0, 0)
        kwargs['disposal_volume'] = 0
        return self.transfer(volume, source, dest, **kwargs)

    @cmds.publish.both(command=cmds.transfer)
    @requires_version(2, 0)
    def transfer(self,
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 trash=True,
                 **kwargs) -> 'InstrumentContext':
        # source: Union[Well, List[Well], List[List[Well]]],
        # dest: Union[Well, List[Well], List[List[Well]]],
        # TODO: Reach consensus on kwargs
        # TODO: Decide if to use a disposal_volume
        # TODO: Accordingly decide if remaining liquid should be blown out to
        # TODO: ..trash or the original well.
        # TODO: What should happen if the user passes a non-first-row well
        # TODO: ..as src/dest *while using multichannel pipette?
        r"""
        Transfer will move a volume of liquid from a source location(s)
        to a dest location(s). It is a higher-level command, incorporating
        other :py:class:`InstrumentContext` commands, like :py:meth:`aspirate`
        and :py:meth:`dispense`, designed to make protocol writing easier at
        the cost of specificity.

        :param volume: The amount of volume to aspirate from each source and
                       dispense to each destination.
                       If volume is a list, each volume will be used for the
                       sources/targets at the matching index. If volumes is a
                       tuple with two elements, like `(20, 100)`, then a list
                       of volumes will be generated with a linear gradient
                       between the two volumes in the tuple.
        :param source: A single well or a list of wells from where liquid
                       will be aspirated.
        :param dest: A single well or a list of wells where liquid
                     will be dispensed to.
        :param \**kwargs: See below

        :Keyword Arguments:

            * *new_tip* (``string``) --

                - 'never': no tips will be picked up or dropped during transfer
                - 'once': (default) a single tip will be used for all commands.
                - 'always': use a new tip for each transfer.

            * *trash* (``boolean``) --
              If `True` (default behavior), tips will be
              dropped in the trash container attached this `Pipette`.
              If `False` tips will be returned to tiprack.

            * *touch_tip* (``boolean``) --
              If `True`, a :py:meth:`touch_tip` will occur following each
              :py:meth:`aspirate` and :py:meth:`dispense`. If set to `False`
              (default behavior), no :py:meth:`touch_tip` will occur.

            * *blow_out* (``boolean``) --
              If `True`, a :py:meth:`blow_out` will occur following each
              :py:meth:`dispense`, but only if the pipette has no liquid left
              in it. If set to `False` (default), no :py:meth:`blow_out` will
              occur.

            * *mix_before* (``tuple``) --
              The tuple, if specified, gives the amount of volume to
              :py:meth:`mix` preceding each :py:meth:`aspirate` during the
              transfer. The tuple is interpreted as (repetitions, volume).

            * *mix_after* (``tuple``) --
              The tuple, if specified, gives the amount of volume to
              :py:meth:`mix` after each :py:meth:`dispense` during the
              transfer. The tuple is interpreted as (repetitions, volume).

            * *disposal_volume* (``float``) --
              (:py:meth:`distribute` only) Volume of liquid to be disposed off
              after distributing. When dispensing multiple times from the same
              tip, it is recommended to aspirate an extra amount of liquid to
              be disposed off after distributing.

            * *carryover* (``boolean``) --
              If `True` (default), any `volume` that exceeds the maximum volume
              of this Pipette will be split into multiple smaller volumes.

            * *gradient* (``lambda``) --
              Function for calculating the curve used for gradient volumes.
              When `volume` is a tuple of length 2, its values are used to
              create a list of gradient volumes. The default curve for this
              gradient is linear (lambda x: x), however a method can be passed
              with the `gradient` keyword argument to create a custom curve.

        :returns: This instance
        """
        self._log.debug("Transfer {} from {} to {}".format(
            volume, source, dest))

        kwargs['mode'] = kwargs.get('mode', 'transfer')

        mix_strategy, mix_opts = self._mix_from_kwargs(kwargs)

        if trash:
            drop_tip = transfers.DropTipStrategy.TRASH
        else:
            drop_tip = transfers.DropTipStrategy.RETURN

        new_tip = kwargs.get('new_tip')
        if isinstance(new_tip, str):
            new_tip = types.TransferTipPolicy[new_tip.upper()]

        blow_out = None
        if kwargs.get('blow_out'):
            blow_out = transfers.BlowOutStrategy.TRASH

        if new_tip != types.TransferTipPolicy.NEVER:
            tr, next_tip = self._next_available_tip()
            max_volume = min(next_tip.max_volume, self.max_volume)
        else:
            max_volume = self.hw_pipette['working_volume']

        touch_tip = None
        if kwargs.get('touch_tip'):
            touch_tip = transfers.TouchTipStrategy.ALWAYS

        default_args = transfers.Transfer()

        disposal = kwargs.get('disposal_volume')
        if disposal is None:
            disposal = default_args.disposal_volume

        air_gap = kwargs.get('air_gap', default_args.air_gap)
        if air_gap < 0 or air_gap >= max_volume:
            raise ValueError(
                "air_gap must be between 0uL and the pipette's expected "
                f"working volume, {max_volume}uL")

        transfer_args = transfers.Transfer(
            new_tip=new_tip or default_args.new_tip,
            air_gap=air_gap,
            carryover=kwargs.get('carryover') or default_args.carryover,
            gradient_function=(kwargs.get('gradient_function') or
                               default_args.gradient_function),
            disposal_volume=disposal,
            mix_strategy=mix_strategy,
            drop_tip_strategy=drop_tip,
            blow_out_strategy=blow_out or default_args.blow_out_strategy,
            touch_tip_strategy=(touch_tip or
                                default_args.touch_tip_strategy)
        )
        transfer_options = transfers.TransferOptions(transfer=transfer_args,
                                                     mix=mix_opts)
        plan = transfers.TransferPlan(volume, source, dest, self, max_volume,
                                      kwargs['mode'], transfer_options)
        self._execute_transfer(plan)
        return self

    def _execute_transfer(self, plan: transfers.TransferPlan):
        for cmd in plan:
            getattr(self, cmd['method'])(*cmd['args'], **cmd['kwargs'])

    @staticmethod
    def _mix_from_kwargs(
            top_kwargs: Dict[str, Any])\
            -> Tuple[transfers.MixStrategy, transfers.Mix]:

        def _mix_requested(kwargs, opt):
            """
            Helper for determining mix options from :py:meth:`transfer` kwargs
            Mixes can be ignored in kwargs by either
            - Not specifying the kwarg
            - Specifying it as None
            - Specifying it as (0, 0)

            This handles all these cases.
            """
            val = kwargs.get(opt)
            if None is val:
                return False
            if val == (0, 0):
                return False
            return True

        mix_opts = transfers.Mix()
        if _mix_requested(top_kwargs, 'mix_before')\
           and _mix_requested(top_kwargs, 'mix_after'):
            mix_strategy = transfers.MixStrategy.BOTH
            before_opts = top_kwargs['mix_before']
            after_opts = top_kwargs['mix_after']
            mix_opts = mix_opts._replace(
                mix_after=mix_opts.mix_after._replace(
                    repetitions=after_opts[0], volume=after_opts[1]),
                mix_before=mix_opts.mix_before._replace(
                    repetitions=before_opts[0], volume=before_opts[1]))
        elif _mix_requested(top_kwargs, 'mix_before'):
            mix_strategy = transfers.MixStrategy.BEFORE
            before_opts = top_kwargs['mix_before']
            mix_opts = mix_opts._replace(
                mix_before=mix_opts.mix_before._replace(
                    repetitions=before_opts[0], volume=before_opts[1]))
        elif _mix_requested(top_kwargs, 'mix_after'):
            mix_strategy = transfers.MixStrategy.AFTER
            after_opts = top_kwargs['mix_after']
            mix_opts = mix_opts._replace(
                mix_after=mix_opts.mix_after._replace(
                    repetitions=after_opts[0], volume=after_opts[1]))
        else:
            mix_strategy = transfers.MixStrategy.NEVER
        return mix_strategy, mix_opts

    @requires_version(2, 0)
    def delay(self):
        return self._ctx.delay()

    @requires_version(2, 0)
    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None
                ) -> 'InstrumentContext':
        """ Move the instrument.

        :param location: The location to move to.
        :type location: :py:class:`.types.Location`
        :param force_direct: If set to true, move directly to destination
                        without arc motion.
        :param minimum_z_height: When specified, this Z margin is able to raise
                                 (but never lower) the mid-arc height.
        :param speed: The speed at which to move. By default,
                      :py:attr:`InstrumentContext.default_speed`. This controls
                      the straight linear speed of the motion; to limit
                      individual axis speeds, you can use
                      :py:attr:`.ProtocolContext.max_speeds`.
        """
        if self._ctx.location_cache:
            from_lw = self._ctx.location_cache.labware
        else:
            from_lw = None

        if not speed:
            speed = self.default_speed

        from_center = 'centerMultichannelOnWells'\
            in quirks_from_any_parent(from_lw)
        cp_override = CriticalPoint.XY_CENTER if from_center else None
        from_loc = types.Location(
            self._hw_manager.hardware.gantry_position(
                self._mount, critical_point=cp_override),
            from_lw)

        for mod in self._ctx._modules:
            if isinstance(mod, ThermocyclerContext):
                mod.flag_unsafe_move(to_loc=location, from_loc=from_loc)

        moves = geometry.plan_moves(from_loc, location, self._ctx.deck,
                                    force_direct=force_direct,
                                    minimum_z_height=minimum_z_height)
        self._log.debug("move_to: {}->{} via:\n\t{}"
                        .format(from_loc, location, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(
                    self._mount, move[0], critical_point=move[1], speed=speed,
                    max_speeds=self._ctx.max_speeds.data)
        except Exception:
            self._ctx.location_cache = None
            raise
        else:
            self._ctx.location_cache = location
        return self

    @property  # type: ignore
    @requires_version(2, 0)
    def mount(self) -> str:
        """ Return the name of the mount this pipette is attached to """
        return self._mount.name.lower()

    @property  # type: ignore
    @requires_version(2, 0)
    def speed(self) -> 'PlungerSpeeds':
        """ The speeds (in mm/s) configured for the pipette plunger.

        This is an object with attributes ``aspirate``, ``dispense``, and
        ``blow_out`` holding the plunger speeds for the corresponding
        operation.

        .. note::
            This property is equivalent to :py:attr:`flow_rate`; the only
            difference is the units in which this property is specified.
            Specifying this attribute uses the units of the linear speed of
            the plunger inside the pipette, while :py:attr:`flow_rate` uses
            the units of the volumetric flow rate of liquid into or out of the
            tip. Because :py:attr:`speed` and :py:attr:`flow_rate` modify the
            same values, setting one will override the other.

        For instance, to set the plunger speed during an aspirate action, do

        .. code-block :: python

            instrument.speed.aspirate = 50

        """
        return self._speeds

    @property  # type: ignore
    @requires_version(2, 0)
    def flow_rate(self) -> 'FlowRates':
        """ The speeds (in uL/s) configured for the pipette.

        This is an object with attributes ``aspirate``, ``dispense``, and
        ``blow_out`` holding the flow rates for the corresponding operation.

        .. note::
          This property is equivalent to :py:attr:`speed`; the only
          difference is the units in which this property is specified.
          specifiying this property uses the units of the volumetric flow rate
          of liquid into or out of the tip, while :py:attr:`speed` uses the
          units of the linear speed of the plunger inside the pipette.
          Because :py:attr:`speed` and :py:attr:`flow_rate` modify the
          same values, setting one will override the other.

        For instance, to change the flow rate for aspiration on an instrument
        you would do

        .. code-block :: python

            instrument.flow_rate.aspirate = 50

        """
        return self._flow_rates

    @property  # type: ignore
    @requires_version(2, 0)
    def type(self) -> str:
        """ One of `'single'` or `'multi'`.
        """
        model = self.name
        if 'single' in model:
            return 'single'
        elif 'multi' in model:
            return 'multi'
        else:
            raise RuntimeError("Bad pipette name: {}".format(model))

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_racks(self) -> List[Labware]:
        """
        The tip racks that have been linked to this pipette.

        This is the property used to determine which tips to pick up next when
        calling :py:meth:`pick_up_tip` without arguments.
        """
        return self._tip_racks

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]):
        self._tip_racks = racks

    @property  # type: ignore
    @requires_version(2, 0)
    def trash_container(self) -> Labware:
        """ The trash container associated with this pipette.

        This is the property used to determine where to drop tips and blow out
        liquids when calling :py:meth:`drop_tip` or :py:meth:`blow_out` without
        arguments.
        """
        return self._trash

    @trash_container.setter
    def trash_container(self, trash: Labware):
        self._trash = trash

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """
        The name string for the pipette (e.g. 'p300_single')
        """
        return self.hw_pipette['name']

    @property  # type: ignore
    @requires_version(2, 0)
    def model(self) -> str:
        """
        The model string for the pipette (e.g. 'p300_single_v1.3')
        """
        return self.hw_pipette['model']

    @property  # type: ignore
    @requires_version(2, 0)
    def min_volume(self) -> float:
        return self.hw_pipette['min_volume']

    @property  # type: ignore
    @requires_version(2, 0)
    def max_volume(self) -> float:
        """
        The maximum volume, in microliters, this pipette can hold.
        """
        return self.hw_pipette['max_volume']

    @property  # type: ignore
    @requires_version(2, 0)
    def current_volume(self) -> float:
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        return self.hw_pipette['current_volume']

    @property  # type: ignore
    @requires_version(2, 0)
    def hw_pipette(self) -> Dict[str, Any]:
        """ View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        pipette = self._hw_manager.hardware.attached_instruments[self._mount]
        if pipette is None:
            raise types.PipetteNotAttachedError
        return pipette

    @property  # type: ignore
    @requires_version(2, 0)
    def channels(self) -> int:
        """ The number of channels on the pipette. """
        return self.hw_pipette['channels']

    @property  # type: ignore
    @requires_version(2, 0)
    def well_bottom_clearance(self) -> 'Clearances':
        """ The distance above the bottom of a well to aspirate or dispense.

        This is an object with attributes ``aspirate`` and ``dispense``,
        describing the default heights of the corresponding operation. The
        default is 1.0mm for both aspirate and dispense.

        When :py:meth:`aspirate` or :py:meth:`dispense` is given a
        :py:class:`.Well` rather than a full :py:class:`.Location`, the robot
        will move this distance above the bottom of the well to aspirate or
        dispense.

        To change, set the corresponding attribute. For instance,

        .. code-block:: python

            instr.well_bottom_clearance.aspirate = 1

        """
        return self._well_bottom_clearance

    def __repr__(self):
        return '<{}: {} in {}>'.format(self.__class__.__name__,
                                       self.hw_pipette['model'],
                                       self._mount.name)

    def __str__(self):
        return '{} on {} mount'.format(self.hw_pipette['display_name'],
                                       self._mount.name.lower())

    def _tip_length_for(self, tiprack: Labware) -> float:
        """ Get the tip length, including overlap, for a tip from this rack """
        tip_overlap = self.hw_pipette['tip_overlap'].get(
            tiprack.uri,
            self.hw_pipette['tip_overlap']['default'])
        tip_length = tiprack.tip_length
        return tip_length - tip_overlap


class ModuleContext(CommandPublisher):
    """ An object representing a connected module.


    .. versionadded:: 2.0

    """

    def __init__(self,
                 ctx: ProtocolContext,
                 geometry: ModuleGeometry,
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
        if self._ctx.api_version < APIVersion(2, 1) and\
                (label or namespace or version):
            MODULE_LOG.warning(
                f'You have specified API {self._ctx.api_version}, but you '
                'are trying to utilize new load_labware parameters in 2.1')
        lw = load(name, self._geometry.location,
                  label, namespace, version,
                  bundled_defs=self._ctx._bundled_labware,
                  extra_defs=self._ctx._extra_labware)
        return self.load_labware_object(lw)

    @requires_version(2, 0)
    def load_labware_from_definition(
            self,
            definition: Dict[str, Any],
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


class TemperatureModuleContext(ModuleContext):
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
    def __init__(self, ctx: ProtocolContext,
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


class MagneticModuleContext(ModuleContext):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0

    """
    def __init__(self,
                 ctx: ProtocolContext,
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
    def engage(self, height: float = None, offset: float = None):
        """ Raise the Magnetic Module's magnets.

        The destination of the magnets can be specified in several different
        ways, based on internally stored default heights for labware:

           - If neither `height` nor `offset` is specified, the magnets will
             raise to a reasonable default height based on the specified
             labware.
           - If `height` is specified, it should be a distance in mm from the
             home position of the magnets.
           - If `offset` is specified, it should be an offset in mm from the
             default position. A positive number moves the magnets higher and
             a negative number moves the magnets lower.

        Only certain labwares have defined engage heights for the Magnetic
        Module. If a labware that does not have a defined engage height is
        loaded on the Magnetic Module (or if no labware is loaded), then
        `height` must be specified.

        :param height: The height to raise the magnets to, in mm from home.
        :param offset: An offset relative to the default height for the labware
                       in mm
        """
        if height:
            dist = height
        elif self.labware and self.labware.magdeck_engage_height is not None:
            dist = self.labware.magdeck_engage_height
            if offset:
                dist += offset
        else:
            raise ValueError(
                "Currently loaded labware {} does not have a known engage "
                "height; please specify explicitly with the height param"
                .format(self.labware))
        self._module.engage(dist)

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


class ThermocyclerContext(ModuleContext):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.

    .. versionadded:: 2.0
    """
    def __init__(self,
                 ctx: ProtocolContext,
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
        if (self.labware is to_lw or self.labware is from_lw) and \
                self.lid_position != 'open':
            raise RuntimeError(
                "Cannot move to labware loaded in Thermocycler"
                " when lid is not fully open.")

    @cmds.publish.both(command=cmds.thermocycler_open)
    @requires_version(2, 0)
    def open_lid(self):
        """ Opens the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.open()
        return self._geometry.lid_status

    @cmds.publish.both(command=cmds.thermocycler_close)
    @requires_version(2, 0)
    def close_lid(self):
        """ Closes the lid"""
        self._prepare_for_lid_move()
        self._geometry.lid_status = self._module.close()
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
                        steps: List[modules.types.ThermocyclerStep],
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
        self._module.stop_lid_heating()

    @cmds.publish.both(command=cmds.thermocycler_deactivate_block)
    @requires_version(2, 0)
    def deactivate_block(self):
        """ Turn off the well block """
        self._module.deactivate()

    @cmds.publish.both(command=cmds.thermocycler_deactivate)
    @requires_version(2, 0)
    def deactivate(self):
        """ Turn off the well block, and heated lid """
        self.deactivate_lid()
        self.deactivate_block()

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
