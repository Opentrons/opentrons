import asyncio
import logging
from typing import Any, Dict, List, Optional, Union

from .labware import Well, Labware, load
from opentrons import types, hardware_control as hc
import opentrons.config.robot_configs as rc
from opentrons.hardware_control import adapters
from . import geometry


MODULE_LOG = logging.getLogger(__name__)


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

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None) -> None:
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
        self._hardware = self._build_hardware_adapter(self._loop)
        self._log = MODULE_LOG.getChild(self.__class__.__name__)

    def connect(self, hardware: hc.API):
        """ Connect to a running hardware API.

        This can be either a simulator or a full hardware controller.

        Note that there is no true disconnected state for a
        :py:class:`.ProtocolContext`; :py:meth:`disconnect` simply creates
        a new simulator and replaces the current hardware with it.
        """
        self._hardware = self._build_hardware_adapter(self._loop, hardware)
        self._hardware.cache_instruments()

    def disconnect(self):
        """ Disconnect from currently-connected hardware and simulate instead
        """
        self._hardware = self._build_hardware_adapter(self._loop)

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
                       self._deck_layout.position_for(location),
                       str(location))
        return self.load_labware(labware, location)

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
            mount: types.Mount,
            replace: bool = False) -> 'InstrumentContext':
        """ Load a specific instrument required by the protocol.

        This value will actually be checked when the protocol runs, to
        ensure that the correct instrument is attached in the specified
        location.

        :param str instrument_name: The name of the instrument model, or a
                                    prefix. For instance, 'p10_single' may be
                                    used to request a P10 single regardless of
                                    the version.
        :param types.Mount mount: The mount in which this instrument should be
                                  attached.
        :param bool replace: Indicate that the currently-loaded instrument in
                             `mount` (if such an instrument exists) should be
                             replaced by `instrument_name`.
        """
        self._log.info("Trying to load {} on {} mount"
                       .format(instrument_name, mount.name.lower()))
        instr = self._instruments[mount]
        if instr and not replace:
            raise RuntimeError("Instrument already present in {} mount: {}"
                               .format(mount.name.lower(),
                                       instr.name))
        attached = {att_mount: instr.get('name', None)
                    for att_mount, instr
                    in self._hardware.attached_instruments.items()}
        attached[mount] = instrument_name
        self._log.debug("cache instruments expectation: {}"
                        .format(attached))
        self._hardware.cache_instruments(attached)
        # If the cache call didn’t raise, the instrument is attached
        new_instr = InstrumentContext(
            self, self._hardware, mount, [], self._log)
        self._instruments[mount] = new_instr
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

    def pause(self):
        """ Pause execution of the protocol until resume is called.

        Note: This function call will not return until the protocol
        is resumed (presumably by a user in the run app).
        """
        raise NotImplementedError

    def resume(self):
        """ Resume a previously-paused protocol. """
        raise NotImplementedError

    def comment(self, msg):
        """ Add a user-readable comment string that will be echoed to the
        Opentrons app. """
        raise NotImplementedError

    @property
    def config(self) -> rc.robot_config:
        """ Get the robot's configuration object.

        :returns .robot_config: The loaded configuration.
        """
        return self._hardware.config

    def update_config(self, **kwargs):
        """ Update values of the robot's configuration.

        `kwargs` should contain keys of the robot's configuration. For instace,
        `update_config(name='Grace Hopper')` would change the name of the robot

        Documentation on keys can be found in the documentation for
        :py:class:`.robot_config`.
        """
        self._hardware.update_config(**kwargs)

    def move_to(self, mount: types.Mount,
                location: types.Location):
        """ Implement motions of the robot.

        This should not need to be called by the user; it is called by
        :py:meth:`InstrumentContext.move_to` (and thus all other
        :py:class:`InstrumentContext` methods that involve moving, such as
        :py:meth:`InstrumentContext.aspirate`) to move the pipettes around.

        It encapsulates location caching and ensures that all moves are safe.
        It does this by taking a :py:class:`.types.Location` that can have
        a position attached to it, and its behavior depends on the state of
        that location cache and the passed location.
        """
        switching_instr = self._last_moved_instrument\
            and self._last_moved_instrument != mount
        if switching_instr:
            # TODO: Is 10 the right number here? This is what’s used in
            # robot since it’s a default to an argument that is never
            # changed
            self._log.debug("retract {}".format(self._last_moved_instrument))
            self._hardware.retract(self._last_moved_instrument, 10)

        if self._location_cache and not switching_instr:
            from_loc = self._location_cache
        else:
            from_loc = types.Location(
                point=self._hardware.gantry_position(mount),
                labware=None)
        moves = geometry.plan_moves(from_loc, location, self._deck_layout)
        self._log.debug("planned moves for {}->{}: {}"
                        .format(from_loc, location, moves))
        self._location_cache = location
        self._last_moved_instrument = mount
        for move in moves:
            self._hardware.move_to(mount, move)

    def home(self):
        """ Homes the robot.
        """
        self._log.debug("home")
        self._hardware.home()

    @staticmethod
    def _build_hardware_adapter(
            loop: asyncio.AbstractEventLoop,
            hardware: hc.API = None) -> adapters.SynchronousAdapter:
        if not hardware:
            hardware = hc.API.build_hardware_simulator(loop=loop)
        return adapters.SynchronousAdapter(hardware)


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
                 hardware: adapters.SynchronousAdapter,
                 mount: types.Mount, tip_racks,
                 log_parent: logging.Logger,
                 **config_kwargs) -> None:
        self._hardware = hardware
        self._ctx = ctx
        self._mount = mount
        self._last_location: Union[Labware, Well, None] = None
        self._log = log_parent.getChild(repr(self))
        self._log.info("attached")

    def aspirate(self,
                 volume: float = None,
                 location: types.Location = None,
                 rate: float = 1.0):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the specified location

        If only a volume is passed, the pipette will aspirate
        from its current position. If only a location is passed,
        :py:meth:`aspirate` will default to its :py:attr:`max_volume`.

        If the :py:class:`.types.Location` passed in `location` has an
        associated labware, that labware will be saved until another motion
        is commanded. This is used to optimize motions - for instance, moving
        between two wells requires much less Z-distance to avoid collisions
        than moving between two pieces of labware.

        :param volume: The volume to aspirate, in microliters. If not
                       specified, :py:attr:`max_volume`.
        :type volume: int or float
        :param location: Where to aspirate from. If unspecified, the
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
        if location:
            self.move_to(location)
        self._hardware.aspirate(self._mount, volume, rate)
        return self

    def dispense(self,
                 volume: float = None,
                 location: types.Location = None,
                 rate: float = 1.0):
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location.

        If only a volume is passed, the pipette will dispense from its current
        position. If only a location is passed, all of the liquid aspirated
        into the pipette will be dispensed (this volume is accessible through
        :py:attr:`current_volume`).

        The location may be a :py:class:`.Well`, or a specific position in
        relation to a :py:class:`.Well`, such as :py:meth:`.Well.top`. If a
        :py:class:`.Well` is specified without calling a position method
        (such as :py:meth:`.Well.top` or :py:meth:`.Well.bottom`), the liquid
        will be dispensed at the bottom of the well.

        :param volume: The volume of liquid to dispense, in microliters. If not
                       specified, defaults to :py:attr:`current_volume`.
        :type volume: int or float
        :param location: Where to dispense into. If unspecified, the
                         current position.
        :param rate: The relative plunger speed for this aspirate. During
                     this aspirate, the speed of the plunger will be
                     `rate` * :py:attr:`aspirate_speed`. If not specified,
                     defaults to 1.0 (speed will not be modified).
        :type rate: float
        :returns: This instance.
        """
        self._log.debug("dispense {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))
        if location:
            self.move_to(location)
        self._hardware.dispense(self._mount, volume, rate)
        return self

    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Well = None,
            rate: float = 1.0):
        raise NotImplementedError

    def blow_out(self, location: Well = None):
        raise NotImplementedError

    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0):
        raise NotImplementedError

    def air_gap(self,
                volume: float = None,
                height: float = None):
        raise NotImplementedError

    def return_tip(self, home_after: bool = True):
        raise NotImplementedError

    def pick_up_tip(self, location: Well = None,
                    presses: int = 3,
                    increment: int = 1):
        raise NotImplementedError

    def drop_tip(self, location: Well = None,
                 home_after: bool = True):
        raise NotImplementedError

    def home(self):
        """ Home the robot.

        :returns: This instance.
        """
        self._ctx.home()
        return self

    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: Well,
                   *args, **kwargs):
        raise NotImplementedError

    def consolidate(self,
                    volume: float,
                    source: Well,
                    dest: Well,
                    *args, **kwargs):
        raise NotImplementedError

    def transfer(self,
                 volume: float,
                 source: Well,
                 dest: Well,
                 **kwargs):
        raise NotImplementedError

    def move_to(self, location: types.Location):
        """ Move this pipette to a specific location on the deck.

        :param location: Where to move to.
        :raises ValueError: if an argument is incorrect.
        """
        self._log.debug("move to {}".format(location))
        self._ctx.move_to(self._mount, location)
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
        """ Query which tipracks have been linked to this PipetteContext"""
        raise NotImplementedError

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]):
        raise NotImplementedError

    @property
    def trash_container(self) -> Labware:
        """ The location the pipette will dispense trash to.
        """
        raise NotImplementedError

    @trash_container.setter
    def trash_container(self, trash: Labware):
        raise NotImplementedError

    @property
    def name(self):
        return self.hw_pipette['name']

    @property
    def max_volume(self):
        """
        The maximum volume, in microliters, this pipette can hold.
        """
        return self.hw_pipette['max_volume']

    @property
    def current_volume(self):
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        return self.hw_pipette['current_volume']

    @property
    def hw_pipette(self) -> Optional[Dict[str, Any]]:
        """ View the information returned by the hardware API directly.
        """
        return self._hardware.attached_instruments[self._mount]

    def __repr__(self):
        return '<{}: {} in {}>'.format(self.__class__.__name__,
                                       self.hw_pipette['name'],
                                       self._mount.name)

    def __str__(self):
        return '{} on {} mount'.format(self.hw_pipette['display_name'],
                                       self._mount.name.lower())
