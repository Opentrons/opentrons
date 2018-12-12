import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Union, Tuple

from .labware import Well, Labware, load, load_module, ModuleGeometry
from opentrons import types, hardware_control as hc, broker, commands as cmds
import opentrons.config.robot_configs as rc
from opentrons.config import advanced_settings
from opentrons.hardware_control import adapters, modules
from . import geometry


MODULE_LOG = logging.getLogger(__name__)

ModuleTypes = Union['TemperatureModuleContext', 'MagneticModuleContext']


class OutOfTipsError(Exception):
    pass


class ProtocolContext:
    """ The Context class is a container for the state of a protocol.

    It encapsulates many of the methods formerly found in the Robot class,
    including labware, instrument, and module loading, as well as core
    functions like pause and resume.

    Unlike the old robot class, it is designed to be ephemeral. The lifetime
    of a particular instance should be about the same as the lifetime of a
    protocol. The only exception is the one stored in
    :py:attr:`.back_compat.robot`, which is provided only for back
    compatibility and should be used less and less as time goes by.
    """

    class HardwareManager:
        def __init__(self, hardware):
            if None is hardware:
                self._is_orig = True
                self._current = adapters.SynchronousAdapter.build(
                    hc.API.build_hardware_simulator)
            elif isinstance(hardware, adapters.SynchronousAdapter):
                self._is_orig = False
                self._current = hardware
            else:
                self._is_orig = False
                self._current = adapters.SynchronousAdapter(hardware)

        @property
        def hardware(self):
            return self._current

        def set_hw(self, hardware):
            if self._is_orig:
                self._is_orig = False
                self._current.join()
            if isinstance(hardware, adapters.SynchronousAdapter):
                self._current = hardware
            elif isinstance(hardware, hc.API):
                self._current = adapters.SynchronousAdapter(hardware)
            else:
                raise TypeError(
                    "hardware should be API or synch adapter but is {}"
                    .format(hardware))
            return self._current

        def reset_hw(self):
            if self._is_orig:
                self._current.join()
            self._current = adapters.SynchronousAdapter.build(
                    hc.API.build_hardware_simulator)
            self._is_orig = True
            return self._current

        def __del__(self):
            orig = getattr(self, '_is_orig', False)
            cur = getattr(self, '_current', None)
            if orig and cur:
                cur.join()

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None,
                 hardware: hc.API = None) -> None:
        """ Build a :py:class:`.ProtocolContext`.

        :param loop: An event loop to use. If not specified, this ctor will
                     (eventually) call :py:meth:`asyncio.get_event_loop`.
        """
        self._loop = loop or asyncio.get_event_loop()
        self._deck_layout = geometry.Deck()
        self._instruments: Dict[types.Mount, Optional[InstrumentContext]]\
            = {mount: None for mount in types.Mount}
        self._last_moved_instrument: Optional[types.Mount] = None
        self._location_cache: Optional[types.Location] = None

        self._hw_manager = ProtocolContext.HardwareManager(hardware)
        self._log = MODULE_LOG.getChild(self.__class__.__name__)
        self._commands: List[str] = []
        self._unsubscribe_commands = None
        self.clear_commands()

    def commands(self):
        return self._commands

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

        self._unsubscribe_commands = broker.subscribe(
            cmds.types.COMMAND, on_command)

    def connect(self, hardware: hc.API):
        """ Connect to a running hardware API.

        This can be either a simulator or a full hardware controller.

        Note that there is no true disconnected state for a
        :py:class:`.ProtocolContext`; :py:meth:`disconnect` simply creates
        a new simulator and replaces the current hardware with it.
        """
        self._hw_manager.set_hw(hardware)
        self._hw_manager.hardware.cache_instruments()

    def disconnect(self):
        """ Disconnect from currently-connected hardware and simulate instead
        """
        self._hw_manager.reset_hw()

    def load_labware(
            self, labware_obj: Labware, location: types.DeckLocation,
            label: str = None, share: bool = False) -> Labware:
        """ Specify the presence of a piece of labware on the OT2 deck.

        This function loads the labware specified by `labware`
        (previously loaded from a configuration file) to the location
        specified by `location`.
        """
        self._deck_layout[location] = labware_obj
        return labware_obj

    def load_labware_by_name(
            self, labware_name: str, location: types.DeckLocation) -> Labware:
        """ A convenience function to specify a piece of labware by name.

        For labware already defined by Opentrons, this is a convient way
        to collapse the two stages of labware initialization (creating
        the labware and adding it to the protocol) into one.

        This function returns the created and initialized labware for use
        later in the protocol.
        """
        labware = load(labware_name,
                       self._deck_layout.position_for(location))
        return self.load_labware(labware, location)

    def load_module(
            self, module_name: str,
            location: types.DeckLocation) -> ModuleTypes:
        for mod in self._hw_manager.hardware.discover_modules():
            if mod.name() == module_name:
                mod_class = {'magdeck': MagneticModuleContext,
                             'tempdeck': TemperatureModuleContext}[module_name]
                break
        else:
            raise KeyError(module_name)
        geometry = load_module(
            module_name, self._deck_layout.position_for(location))
        mod_ctx = mod_class(self,
                            mod,
                            geometry,
                            self._loop)
        self._deck_layout[location] = geometry
        return mod_ctx

    @property
    def loaded_labwares(self) -> Dict[int, Labware]:
        """ Get the labwares that have been loaded into the protocol context.

        The return value is a dict mapping locations to labware, sorted
        in order of the locations.
        """
        return dict(self._deck_layout)

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
        attached = {att_mount: instr.get('name', None)
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
            tip_racks=tip_racks,
            log_parent=self._log)
        self._instruments[checked_mount] = new_instr
        self._log.info("Instrument {} loaded".format(new_instr))
        return new_instr

    @property
    def loaded_instruments(self) -> Dict[str, Optional['InstrumentContext']]:
        """ Get the instruments that have been loaded into the protocol.

        :returns: A dict mapping mount names in lowercase to the instrument
                  in that mount, or `None` if no instrument is present.
        """
        return {mount.name.lower(): instr for mount, instr
                in self._instruments.items()}

    def reset(self):
        """ Reset the state of the context and the hardware.

        For instance, this call will
        - reset all cached knowledge about attached tips
        - unload all labware
        - unload all instruments
        - clear all location and instrument caches

        The only state that will be kept is the position of the robot.
        """
        raise NotImplementedError

    @cmds.publish.both(command=cmds.pause)
    def pause(self, msg):
        """ Pause execution of the protocol until resume is called.

        This function returns immediately, but the next function call that
        is blocked by a paused robot (anything that involves moving) will
        not return until :py:meth:`resume` is called.

        :param str msg: A message to echo back to connected clients.
        """
        raise NotImplementedError

    @cmds.publish.both(command=cmds.resume)
    def resume(self):
        """ Resume a previously-paused protocol """
        raise NotImplementedError

    @cmds.publish.both(command=cmds.comment)
    def comment(self, msg):
        """ Add a user-readable comment string that will be echoed to the
        Opentrons app. """
        pass

    @cmds.publish.both(command=cmds.delay)
    def delay(self, seconds=0, minutes=0):
        """ Delay protocol execution for a specific amount of time.

        :param float seconds: A time to delay in seconds
        :param float minutes: A time to delay in minutes

        If both `seconds` and `minutes` are specified, they will be added.
        """
        delay_time = seconds + minutes*60
        self.pause()
        time.sleep(delay_time)
        self.resume()

    @property
    def config(self) -> rc.robot_config:
        """ Get the robot's configuration object.

        :returns .robot_config: The loaded configuration.
        """
        return self._hw_manager.hardware.config

    def update_config(self, **kwargs):
        """ Update values of the robot's configuration.

        `kwargs` should contain keys of the robot's configuration. For instace,
        `update_config(name='Grace Hopper')` would change the name of the robot

        Documentation on keys can be found in the documentation for
        :py:class:`.robot_config`.
        """
        self._hw_manager.hardware.update_config(**kwargs)

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

    @property
    def deck(self) -> geometry.Deck:
        """ The object holding the deck layout of the robot.
        """
        return self._deck_layout


class InstrumentContext:
    """ A context for a specific pipette or instrument.

    This can be used to call methods related to pipettes - moves or
    aspirates or dispenses, or higher-level methods.

    Instances of this class bundle up state and config changes to a
    pipette - for instance, changes to flow rates or trash containers.
    Action methods (like :py:meth:`aspirate` or :py:meth:`distribute`) are
    defined here for convenience.

    In general, this class should not be instantiated directly; rather,
    instances are returned from :py:meth:`ProtcolContext.load_instrument`.
    """

    def __init__(self,
                 ctx: ProtocolContext,
                 hardware_mgr: ProtocolContext.HardwareManager,
                 mount: types.Mount,
                 log_parent: logging.Logger,
                 tip_racks: List[Labware] = None,
                 trash: Labware = None,
                 **config_kwargs) -> None:
        self._hw_manager = hardware_mgr
        self._ctx = ctx
        self._mount = mount

        self._tip_racks = tip_racks or list()
        for tip_rack in self.tip_racks:
            assert tip_rack.is_tiprack
        if trash is None:
            if advanced_settings.get_adv_setting('shortFixedTrash'):
                trash_name = 'opentrons_1_trash_0.85_L'
            else:
                trash_name = 'opentrons_1_trash_1.1_L'
            self.trash_container = self._ctx.load_labware_by_name(
                trash_name, '12')
        else:
            self.trash_container = trash

        self._last_location: Union[Labware, Well, None] = None
        self._last_tip_picked_up_from: Union[Well, None] = None
        self._log = log_parent.getChild(repr(self))
        self._log.info("attached")
        self._well_bottom_clearance = 0.5

    def aspirate(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the specified location

        If only a volume is passed, the pipette will aspirate
        from its current position. If only a location is passed,
        :py:meth:`aspirate` will default to its :py:attr:`max_volume`.

        :param volume: The volume to aspirate, in microliters. If not
                       specified, :py:attr:`max_volume`.
        :type volume: int or float
        :param location: Where to aspirate from. If `location` is a
                         :py:class:`.Well`, the robot will aspirate from
                         :py:attr:`well_bottom_clearance` mm
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
        """
        self._log.debug("aspirate {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))

        if isinstance(location, Well):
            point, well = location.bottom()
            loc = types.Location(
                point + types.Point(0, 0, self.well_bottom_clearance),
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
                "If aspirate is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")
        cmds.do_publish(cmds.aspirate, self.aspirate, 'before', None, None,
                        self, volume, loc, rate)
        self._hw_manager.hardware.aspirate(self._mount, volume, rate)
        cmds.do_publish(cmds.aspirate, self.aspirate, 'after', self, None,
                        self, volume, loc, rate)
        return self

    def dispense(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContext':
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location.

        If only a volume is passed, the pipette will dispense from its current
        position. If only a location is passed, all of the liquid aspirated
        into the pipette will be dispensed (this volume is accessible through
        :py:attr:`current_volume`).

        :param volume: The volume of liquid to dispense, in microliters. If not
                       specified, defaults to :py:attr:`current_volume`.
        :type volume: int or float
        :param location: Where to dispense into. If `location` is a
                         :py:class:`.Well`, the robot will dispense into
                         :py:attr:`well_bottom_clearance` mm
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
        """
        self._log.debug("dispense {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))
        if isinstance(location, Well):
            point, well = location.bottom()
            loc = types.Location(
                point + types.Point(0, 0, self.well_bottom_clearance),
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
        cmds.do_publish(cmds.dispense, self.dispense, 'before', None, None,
                        self, volume, loc, rate)
        self._hw_manager.hardware.dispense(self._mount, volume, rate)
        cmds.do_publish(cmds.dispense, self.dispense, 'after', self, None,
                        self, volume, loc, rate)
        return self

    @cmds.publish.both(command=cmds.mix)
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Well = None,
            rate: float = 1.0) -> 'InstrumentContext':
        raise NotImplementedError

    @cmds.publish.both(command=cmds.blow_out)
    def blow_out(self, location: Well = None) -> 'InstrumentContext':
        """
        Blow liquid out of the tip.

        If called without arguments, blow out into the
        :py:attr:`trash_container`.
        """
        raise NotImplementedError

    @cmds.publish.both(command=cmds.touch_tip)
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'InstrumentContext':
        raise NotImplementedError

    @cmds.publish.both(command=cmds.air_gap)
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'InstrumentContext':
        raise NotImplementedError

    @cmds.publish.both(command=cmds.return_tip)
    def return_tip(self) -> 'InstrumentContext':
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
        self.drop_tip(loc.top())
        return self

    @cmds.publish.both(command=cmds.pick_up_tip)  # noqa(C901)
    def pick_up_tip(self, location: Union[types.Location, Well] = None,
                    presses: int = 3,
                    increment: float = 1.0) -> 'InstrumentContext':
        """
        Pick up a tip for the pipette to run liquid-handling commands with

        If no location is passed, the Pipette will pick up the next available
        tip in its :py:attr:`InstrumentContext.tip_racks` list.

        The tip to pick up can be manually specified with the `location`
        argument. The `location` argument can be specified in several ways:

            - If the only thing to specify is which well from which to pick
              up a tip, `location` can be a :py:class:`.Well`. For instance,
              if you have a tip rack in a variable called `tiprack`, you can
              pick up a specific tip from it with
              `instr.pick_up_tip(tiprack.wells()[0])`. This style of call can
              be used to make the robot pick up a tip from a tip rack that
              was not specified when creating the
              :py:class:`.InstrumentContext`.
            - If the position to move to in the well needs to be specified,
              for instance to tell the robot to run its pick up tip routine
              starting closer to or farther from the top of the tip, `location`
              can be a :py:class:`.types.Location`; for instance, you can call
              `instr.pick_up_tip(tiprack.wells()[0].top())`.

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
        num_channels = self.channels

        def _select_tiprack_from_list(tip_racks) -> Tuple[Labware, Well]:
            try:
                tr = tip_racks[0]
            except IndexError:
                raise OutOfTipsError
            next_tip = tr.next_tip(num_channels)
            if next_tip:
                return tr, next_tip
            else:
                return _select_tiprack_from_list(tip_racks[1:])

        if location and isinstance(location, types.Location):
            if isinstance(location.labware, Labware):
                tiprack = location.labware
                target: Well = tiprack.next_tip(num_channels)  # type: ignore
                if not target:
                    raise OutOfTipsError
            elif isinstance(location.labware, Well):
                tiprack = location.labware.parent
                target = location.labware
        elif location and isinstance(location, Well):
            tiprack = location.parent
            target = location
        elif not location:
            tiprack, target = _select_tiprack_from_list(self.tip_racks)
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))

        assert tiprack.is_tiprack, "{} is not a tiprack".format(str(tiprack))

        self.move_to(target.top())

        self._hw_manager.hardware.pick_up_tip(
            self._mount, tiprack.tip_length, presses, increment)
        # Note that the hardware API pick_up_tip action includes homing z after

        tiprack.use_tips(target, num_channels)
        self._last_tip_picked_up_from = target
        return self

    @cmds.publish.both(command=cmds.drop_tip)
    def drop_tip(
            self,
            location: Union[types.Location, Well] = None)\
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
              `instr.pick_up_tip(tiprack.wells()[0])`. This style of call can
              be used to make the robot drop a tip into arbitrary labware.
            - If the position to drop the tip from as well as the
              :py:class:`.Well` to drop the tip into needs to be specified,
              for instance to tell the robot to drop a tip from an unusually
              large height above the tiprack, `location`
              can be a :py:class:`.types.Location`; for instance, you can call
              `instr.pick_up_tip(tiprack.wells()[0].top())`.

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
                target = location.labware
            else:
                raise TypeError(
                    "If a location is specified as a types.Location (for "
                    "instance, as the result of a call to "
                    "tiprack.wells()[0].top()) it must be a location "
                    "relative to a well, since that is where a tip is "
                    "dropped. The passed location, however, is in "
                    "reference to {}".format(location.labware))
        elif location and isinstance(location, Well):
            target = location
        elif not location:
            target = self.trash_container.wells()[0]
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))

        self.move_to(target.top())
        self._hw_manager.hardware.drop_tip(self._mount)
        return self

    def home(self) -> 'InstrumentContext':
        """ Home the robot.

        :returns: This instance.
        """
        def home_dummy(mount): pass
        cmds.do_publish(cmds.home, home_dummy, 'before', None, None,
                        self._mount.name.lower())
        self._ctx.home()
        cmds.do_publish(cmds.home, home_dummy, 'after', self, None,
                        self._mount.name.lower())
        return self

    def home_plunger(self) -> 'InstrumentContext':
        """ Home the plunger associated with this mount

        :returns: This instance.
        """
        self._hw_manager.hardware.home_plunger(self.mount)
        return self

    @cmds.publish.both(command=cmds.distribute)
    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: Well,
                   *args, **kwargs) -> 'InstrumentContext':
        raise NotImplementedError

    @cmds.publish.both(command=cmds.consolidate)
    def consolidate(self,
                    volume: float,
                    source: Well,
                    dest: Well,
                    *args, **kwargs) -> 'InstrumentContext':
        raise NotImplementedError

    @cmds.publish.both(command=cmds.transfer)
    def transfer(self,
                 volume: float,
                 source: Well,
                 dest: Well,
                 **kwargs) -> 'InstrumentContext':
        raise NotImplementedError

    def delay(self):
        return self._ctx.delay()

    def move_to(self, location: types.Location) -> 'InstrumentContext':
        """ Move the instrument.

        :param location: The location to move to.
        :type location: :py:class:`.types.Location`
        """
        if self._ctx.location_cache:
            from_lw = self._ctx.location_cache.labware
        else:
            from_lw = None
        from_loc = types.Location(
            self._hw_manager.hardware.gantry_position(self._mount),
            from_lw)
        moves = geometry.plan_moves(from_loc, location, self._ctx.deck)
        self._log.debug("move {}->{}: {}"
                        .format(from_loc, location, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(self._mount, move)
        except Exception:
            self._ctx.location_cache = None
            raise
        else:
            self._ctx.location_cache = location
        return self

    @property
    def mount(self) -> str:
        return self._mount.name.lower()

    @property
    def speeds(self) -> Dict[str, float]:
        """ The speeds (in mm/s) configured for the pipette, as a dict.

        The keys will be 'aspirate' and 'dispense' (e.g. the keys of
        :py:class:`MODE`)

        :note: This property is equivalent to :py:attr:`speeds`; the only
        difference is the units in which this property is specified.
        """
        raise NotImplementedError

    @speeds.setter
    def speeds(self, new_speeds: Dict[str, float]) -> None:
        """ Update the speeds (in mm/s) set for the pipette.

        :param new_speeds: A dict containing at least one of 'aspirate'
        and 'dispense',  mapping to new speeds in mm/s.
        """
        raise NotImplementedError

    @property
    def flow_rate(self) -> Dict[str, float]:
        """ The speeds (in uL/s) configured for the pipette, as a dict.

        The  keys will be 'aspirate' and 'dispense'.

        :note: This property is equivalent to :py:attr:`speeds`; the only
        difference is the units in which this property is specified.
        """
        raise NotImplementedError

    @flow_rate.setter
    def flow_rate(self, new_flow_rate: Dict[str, float]) -> None:
        """ Update the speeds (in uL/s) for the pipette.

        :param new_flow_rates: A dict containing at least one of 'aspirate
        and 'dispense', mapping to new speeds in uL/s.
        """
        raise NotImplementedError

    @property
    def pick_up_current(self) -> float:
        """
        The current (amperes) the pipette mount's motor will use
        while picking up a tip. Specified in amps.
        """
        raise NotImplementedError

    @pick_up_current.setter
    def pick_up_current(self, amps: float):
        """ Set the current used when picking up a tip.

        :param amps: The current, in amperes. Acceptable values: (0.0, 2.0)
        """
        raise NotImplementedError

    @property
    def type(self) -> str:
        """ One of `'single'` or `'multi'`.
        """
        model = self.name
        if 'single' in model:
            return 'single'
        elif 'multi' in model:
            return 'multi'
        else:
            raise RuntimeError("Bad pipette model name: {}".format(model))

    @property
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

    @property
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

    @property
    def name(self) -> str:
        """
        The model string for the pipette.
        """
        return self.hw_pipette['name']

    @property
    def max_volume(self) -> float:
        """
        The maximum volume, in microliters, this pipette can hold.
        """
        return self.hw_pipette['max_volume']

    @property
    def current_volume(self) -> float:
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        return self.hw_pipette['current_volume']

    @property
    def hw_pipette(self) -> Dict[str, Any]:
        """ View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        pipette = self._hw_manager.hardware.attached_instruments[self._mount]
        if pipette is None:
            raise types.PipetteNotAttachedError
        return pipette

    @property
    def channels(self) -> int:
        """ The number of channels on the pipette. """
        return self.hw_pipette['channels']

    @property
    def well_bottom_clearance(self) -> float:
        """ The distance above the bottom of a well to aspirate or dispense.

        When :py:meth:`aspirate` or :py:meth:`dispense` is given a
        :py:class:`.Well` rather than a full :py:class:`.Location`, the robot
        will move this distance above the bottom of the well to aspirate or
        dispense.
        """
        return self._well_bottom_clearance

    @well_bottom_clearance.setter
    def well_bottom_clearance(self, clearance: float):
        assert clearance >= 0
        self._well_bottom_clearance = clearance

    def __repr__(self):
        return '<{}: {} in {}>'.format(self.__class__.__name__,
                                       self.hw_pipette['name'],
                                       self._mount.name)

    def __str__(self):
        return '{} on {} mount'.format(self.hw_pipette['display_name'],
                                       self._mount.name.lower())


class ModuleContext:
    """ An object representing a connected module. """

    def __init__(self, ctx: ProtocolContext, geometry: ModuleGeometry) -> None:
        """ Build the ModuleContext.

        This usually should not be instantiated directly; instead, modules
        should be loaded using :py:meth:`ProtocolContext.load_module`.

        :param ctx: The parent context for the module
        :param geometry: The :py:class:`.ModuleGeometry` for the module
        """
        self._geometry = geometry
        self._ctx = ctx

    def load_labware(self, labware: Labware) -> Labware:
        """ Specify the presence of a piece of labware on the module.

        :param labware: The labware object. This object should be already
                        initialized and its parent should be set to this
                        module's geometry. To initialize and load a labware
                        onto the module in one step, see
                        :py:meth:`load_labware_by_name`.
        :returns: The properly-linked labware object
        """
        self._geometry.add_labware(labware)
        self._ctx.deck.recalculate_high_z()
        return labware

    def load_labware_by_name(self, name: str) -> Labware:
        """ Specify the presence of a piece of labware on the module.

        :param name: The name of the labware object.
        :returns: The initialized and loaded labware object.
        """
        lw = load(name, self._geometry.location)
        return self.load_labware(lw)

    @property
    def labware(self) -> Optional[Labware]:
        """ The labware (if any) present on this module. """
        return self._geometry.labware

    def __repr__(self):
        return "{} at {} lw {}".format(self.__class__.__name__,
                                       self._geometry,
                                       self.labware)


class TemperatureModuleContext(ModuleContext):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.
    """
    def __init__(self, ctx: ProtocolContext,
                 hw_module: modules.tempdeck.TempDeck,
                 geometry: ModuleGeometry,
                 loop: asyncio.AbstractEventLoop) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry)

    @cmds.publish.both(command=cmds.tempdeck_set_temp)
    def set_temperature(self, celsius: float):
        """ Set the target temperature, in C.

        Must be between 4 and 95C based on Opentrons QA.

        :param celsius: The target temperature, in C
        """
        return self._module.set_temperature(celsius)

    @cmds.publish.both(command=cmds.tempdeck_deactivate)
    def deactivate(self):
        """ Stop heating (or cooling) and turn off the fan.
        """
        return self._module.disengage()

    def wait_for_temp(self):
        """ Block until the module reaches its setpoint.
        """
        self._loop.run_until_complete(self._module.wait_for_temp())

    @property
    def temperature(self):
        """ Current temperature in C"""
        return self._module.temperature

    @property
    def target(self):
        """ Current target temperature in C"""
        return self._module.target


class MagneticModuleContext(ModuleContext):
    """ An object representing a connected Temperature Module.

    It should not be instantiated directly; instead, it should be
    created through :py:meth:`.ProtocolContext.load_module`.
    """
    def __init__(self,
                 ctx: ProtocolContext,
                 hw_module: modules.magdeck.MagDeck,
                 geometry: ModuleGeometry,
                 loop: asyncio.AbstractEventLoop) -> None:
        self._module = hw_module
        self._loop = loop
        super().__init__(ctx, geometry)

    @cmds.publish.both(command=cmds.magdeck_calibrate)
    def calibrate(self):
        """ Calibrate the Magnetic Module.

        The calibration is used to establish the position of the lawbare on
        top of the magnetic module.
        """
        self._module.calibrate()

    def load_labware(self, labware: Labware) -> Labware:
        """
        Load labware onto a Magnetic Module, checking if it is compatible
        """
        if labware.magdeck_engage_height is None:
            MODULE_LOG.warning(
                "This labware ({}) is not explicitly compatible with the"
                " Magnetic Module. You will have to specify a height when"
                " calling engage().")
        return super().load_labware(labware)

    @cmds.publish.both(command=cmds.magdeck_engage)
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
    def disengage(self):
        """ Lower the magnets back into the Magnetic Module.
        """
        self._module.disengage()

    @property
    def status(self):
        """ The status of the module. either 'engaged' or 'disengaged' """
        return self._module.status
