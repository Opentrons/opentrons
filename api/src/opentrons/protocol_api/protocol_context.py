import contextlib
import logging
from typing import (Dict, List, Optional, Union, TYPE_CHECKING)

from opentrons import types
from opentrons.hardware_control import API
from opentrons.protocols.implementation.interfaces.protocol_context import \
    AbstractProtocolContext
from opentrons.protocols.types import APIVersion
from .labware import Labware
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.protocols.geometry.deck import Deck
from .instrument_context import InstrumentContext
from .module_contexts import ModuleContext, ModuleTypes
from opentrons.protocols.api_support.util import (
    AxisMaxSpeeds, requires_version)

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition

MODULE_LOG = logging.getLogger(__name__)


class ProtocolContext:
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

    def __init__(self, implementation: AbstractProtocolContext) -> None:
        """ Build a :py:class:`.ProtocolContext`.

        :param implementation: The implementation of the protocol API context
        """
        self._implementation = implementation

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        """ Return the API version supported by this protocol context.

        The supported API version was specified when the protocol context
        was initialized. It may be lower than the highest version supported
        by the robot software. For the highest version supported by the
        robot software, see :py:attr:`.protocol_api.MAX_SUPPORTED_VERSION`.
        """
        return self._implementation.get_api_version()

    @property  # type: ignore
    @requires_version(2, 0)
    def bundled_data(self) -> Dict[str, bytes]:
        """ Accessor for data files bundled with this protocol, if any.

        This is a dictionary mapping the filenames of bundled datafiles, with
        extensions but without paths (e.g. if a file is stored in the bundle as
        ``data/mydata/aspirations.csv`` it will be in the dict as
        ``'aspirations.csv'``) to the bytes contents of the files.
        """
        return self._implementation.get_bundled_data()

    def cleanup(self):
        """ Finalize and clean up the protocol context. """
        self._implementation.cleanup()

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
        return self._implementation.get_max_speeds()

    @requires_version(2, 0)
    def commands(self):
        return self._implementation.get_commands()

    @requires_version(2, 0)
    def clear_commands(self):
        self._implementation.clear_commands()

    @contextlib.contextmanager
    def temp_connect(self, hardware: API):
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
        self._implementation.temp_connect(hardware)

    @requires_version(2, 0)
    def connect(self, hardware: API):
        """ Connect to a running hardware API.

        This can be either a simulator or a full hardware controller.

        Note that there is no true disconnected state for a
        :py:class:`.ProtocolContext`; :py:meth:`disconnect` simply creates
        a new simulator and replaces the current hardware with it.
        """
        self._implementation.connect(hardware)

    @requires_version(2, 0)
    def disconnect(self):
        """ Disconnect from currently-connected hardware and simulate instead
        """
        self._implementation.disconnect()

    @requires_version(2, 0)
    def is_simulating(self) -> bool:
        return self._implementation.is_simulating()

    @requires_version(2, 0)
    def load_labware_from_definition(
            self,
            labware_def: 'LabwareDefinition',
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
        return self._implementation.load_labware_from_definition(labware_def,
                                                                 location,
                                                                 label)

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
        return self._implementation.load_labware(load_name, location, label,
                                                 namespace, version)

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
        return self._implementation.get_loaded_labwares()

    @requires_version(2, 0)
    def load_module(
            self, module_name: str,
            location: Optional[types.DeckLocation] = None,
            configuration: str = None) -> ModuleTypes:
        """ Load a module onto the deck given its name.

        This is the function to call to use a module in your protocol, like
        :py:meth:`load_instrument` is the method to call to use an instrument
        in your protocol. It returns the created and initialized module
        context, which will be a different class depending on the kind of
        module loaded.

        A map of deck positions to loaded modules can be accessed later
        using :py:attr:`loaded_modules`.

        :param str module_name: The name or model of the module.
        :param location: The location of the module. This is usually the
                         name or number of the slot on the deck where you
                         will be placing the module. Some modules, like
                         the Thermocycler, are only valid in one deck
                         location. You do not have to specify a location
                         when loading a Thermocycler - it will always be
                         in Slot 7.
        :param configuration: Used to specify the slot configuration of
                              the Thermocycler. Only Valid in Python API
                              Version 2.4 and later. If you wish to use
                              the non-full plate configuration, you must
                              pass in the key word value `semi`
        :type location: str or int or None
        :returns ModuleContext: The loaded and initialized
                                :py:class:`ModuleContext`.
        """
        return self._implementation.load_module(module_name=module_name,
                                                location=location,
                                                configuration=configuration)

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
        return self._implementation.get_loaded_modules()

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

        return self._implementation.load_instrument(
            instrument_name=instrument_name,
            mount=checked_mount,
            tip_racks=tip_racks,
            replace=replace)

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
        return self._implementation.get_loaded_instruments()

    @requires_version(2, 0)
    def pause(self, msg=None):
        """ Pause execution of the protocol until resume is called.

        This function returns immediately, but the next function call that
        is blocked by a paused robot (anything that involves moving) will
        not return until :py:meth:`resume` is called.

        :param str msg: A message to echo back to connected clients.
        """
        self._implementation.pause(msg=msg)

    @requires_version(2, 0)
    def resume(self):
        """ Resume a previously-paused protocol """
        self._implementation.resume()

    @requires_version(2, 0)
    def comment(self, msg):
        """
        Add a user-readable comment string that will be echoed to the Opentrons
        app.

        The value of the message is computed during protocol simulation,
        so cannot be used to communicate real-time information from the robot's
        actual run.
        """
        self._implementation.comment(msg=msg)

    @requires_version(2, 0)
    def delay(self, seconds=0, minutes=0, msg=None):
        """ Delay protocol execution for a specific amount of time.

        :param float seconds: A time to delay in seconds
        :param float minutes: A time to delay in minutes

        If both `seconds` and `minutes` are specified, they will be added.
        """
        delay_time = seconds + minutes * 60
        self._implementation.delay(seconds=delay_time, msg=msg)

    @requires_version(2, 0)
    def home(self):
        """ Homes the robot.
        """
        self._implementation.home()

    @property  # type: ignore
    @requires_version(2, 0)
    def deck(self) -> Deck:
        """ The object holding the deck layout of the robot.

        This object behaves like a dictionary with keys for both numeric
        and string slot numbers (for instance, ``protocol.deck[1]`` and
        ``protocol.deck['1']`` will both return the object in slot 1). If
        nothing is loaded into a slot, ``None`` will be present. This object
        is useful for determining if a slot in the deck is free. Rather than
        filtering the objects in the deck map yourself, you can also use
        :py:attr:`loaded_labwares` to see a dict of labwares and
        :py:attr:`loaded_modules` to see a dict of modules. For advanced
        control you can delete an item of labware from the deck with
        e.g. ``del protocol.deck['1']`` to free a slot for new labware.
        (Note that for each slot only the last labware used in a command will
        be available for calibration in the OpenTrons UI, and that the
        tallest labware on the deck will be calculated using only currently
        loaded labware, meaning that the labware loaded should always
        reflect the labware physically on the deck (or be higher than the
        labware on the deck).
        """
        return self._implementation.get_deck()

    @property  # type: ignore
    @requires_version(2, 0)
    def fixed_trash(self) -> Labware:
        """ The trash fixed to slot 12 of the robot deck.

        It has one well and should be accessed like labware in your protocol.
        e.g. ``protocol.fixed_trash['A1']``
        """
        return self._implementation.get_fixed_trash()

    @requires_version(2, 5)
    def set_rail_lights(self, on: bool):
        """
        Controls the robot rail lights

        :param bool on: If true, turn on rail lights; otherwise, turn off.
        """
        self._implementation.set_rail_lights(on=on)

    @property  # type: ignore
    @requires_version(2, 5)
    def rail_lights_on(self) -> bool:
        """ Returns True if the rail lights are on """
        return self._implementation.get_rail_lights_on()

    @property  # type: ignore
    @requires_version(2, 5)
    def door_closed(self) -> bool:
        """ Returns True if the robot door is closed """
        return self._implementation.door_closed()
