from __future__ import annotations

import logging
from typing import (
    Callable,
    Dict,
    List,
    NamedTuple,
    Optional,
    Type,
    Union,
    Mapping,
    cast,
)

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.types import Mount, Location, DeckLocation, DeckSlotName
from opentrons.broker import Broker
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.modules.types import MagneticBlockModel
from opentrons.commands import protocol_commands as cmds, types as cmd_types
from opentrons.commands.publisher import CommandPublisher, publish
from opentrons.protocols.api_support import instrument as instrument_support
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import (
    AxisMaxSpeeds,
    requires_version,
    APIVersionError,
)

from ._types import OffDeckType
from .core.common import ModuleCore, ProtocolCore
from .core.core_map import LoadedCoreMap
from .core.engine.module_core import NonConnectedModuleCore
from .core.module import (
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
    AbstractMagneticBlockCore,
)
from .core.engine import ENGINE_CORE_API_VERSION
from .core.engine.protocol import ProtocolCore as ProtocolEngineCore
from .core.legacy.legacy_protocol_core import LegacyProtocolCore

from . import validation
from ._liquid import Liquid
from .deck import Deck
from .instrument_context import InstrumentContext
from .labware import Labware
from .module_contexts import (
    MagneticModuleContext,
    TemperatureModuleContext,
    ThermocyclerContext,
    HeaterShakerContext,
    MagneticBlockContext,
    ModuleContext,
)


logger = logging.getLogger(__name__)


ModuleTypes = Union[
    TemperatureModuleContext,
    MagneticModuleContext,
    ThermocyclerContext,
    HeaterShakerContext,
    MagneticBlockContext,
]


class HardwareManager(NamedTuple):
    """Back. compat. wrapper for a removed class called `HardwareManager`.

    This interface will not be present in PAPIv3.
    """

    hardware: SyncHardwareAPI


class ProtocolContext(CommandPublisher):
    """The Context class is a container for the state of a protocol.

    It encapsulates many of the methods formerly found in the Robot class,
    including labware, instrument, and module loading, as well as core
    functions like pause and resume.

    Unlike the old robot class, it is designed to be ephemeral. The lifetime
    of a particular instance should be about the same as the lifetime of a
    protocol. The only exception is the one stored in
    ``.legacy_api.api.robot``, which is provided only for back
    compatibility and should be used less and less as time goes by.

    .. versionadded:: 2.0

    """

    def __init__(
        self,
        api_version: APIVersion,
        core: ProtocolCore,
        broker: Optional[Broker] = None,
        core_map: Optional[LoadedCoreMap] = None,
        deck: Optional[Deck] = None,
        bundled_data: Optional[Dict[str, bytes]] = None,
    ) -> None:
        """Build a :py:class:`.ProtocolContext`.

        :param api_version: The API version to use.
        :param core: The protocol implementation core.
        :param labware_offset_provider: Where this protocol context and its child
                                        module contexts will get labware offsets from.
        :param broker: An optional command broker to link to. If not
                      specified, a dummy one is used.
        :param bundled_data: A dict mapping filenames to the contents of data
                             files. Can be used by the protocol, since it is
                             exposed as
                             :py:attr:`.ProtocolContext.bundled_data`
        """
        super().__init__(broker)
        self._api_version = api_version
        self._core = core
        self._core_map = core_map or LoadedCoreMap()
        self._deck = deck or Deck(protocol_core=core, core_map=self._core_map)

        # With the introduction of Extension mount type, this dict initializes to include
        # the extension mount, for both ot2 & 3. While it doesn't seem like it would
        # create an issue in the current PAPI context, it would be much safer to
        # only use mounts available on the robot.
        self._instruments: Dict[Mount, Optional[InstrumentContext]] = {
            mount: None for mount in Mount
        }
        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._load_fixed_trash()

        self._commands: List[str] = []
        self._unsubscribe_commands: Optional[Callable[[], None]] = None
        self.clear_commands()

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        """Return the API version supported by this protocol context.

        The supported API version was specified when the protocol context
        was initialized. It may be lower than the highest version supported
        by the robot software. For the highest version supported by the
        robot software, see ``protocol_api.MAX_SUPPORTED_VERSION``.
        """
        return self._api_version

    @property
    def _hw_manager(self) -> HardwareManager:
        # TODO (lc 01-05-2021) remove this once we have a more
        # user facing hardware control http api.
        logger.warning(
            "This function will be deprecated in later versions."
            "Please use with caution."
        )
        return HardwareManager(hardware=self._core.get_hardware())

    @property  # type: ignore
    @requires_version(2, 0)
    def bundled_data(self) -> Dict[str, bytes]:
        """Accessor for data files bundled with this protocol, if any.

        This is a dictionary mapping the filenames of bundled datafiles, with
        extensions but without paths (e.g. if a file is stored in the bundle as
        ``data/mydata/aspirations.csv`` it will be in the dict as
        ``'aspirations.csv'``) to the bytes contents of the files.
        """
        return self._bundled_data

    def cleanup(self) -> None:
        """Finalize and clean up the protocol context."""
        if self._unsubscribe_commands:
            self._unsubscribe_commands()
            self._unsubscribe_commands = None

    def __del__(self) -> None:
        if getattr(self, "_unsubscribe_commands", None):
            self._unsubscribe_commands()  # type: ignore

    @property  # type: ignore
    @requires_version(2, 0)
    def max_speeds(self) -> AxisMaxSpeeds:
        """Per-axis speed limits when moving this instrument.

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

        .. caution::
            This property is not yet supported on
            :ref:`API version <v2-versioning>` 2.14 or higher.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            # TODO(mc, 2023-02-23): per-axis max speeds not yet supported on the engine
            # See https://opentrons.atlassian.net/browse/RCORE-373
            raise APIVersionError(
                "ProtocolContext.max_speeds is not supported at apiLevel 2.14 or higher."
                " Use a lower apiLevel or set speeds using InstrumentContext.default_speed"
                " or the per-method 'speed' argument."
            )

        return self._core.get_max_speeds()

    @requires_version(2, 0)
    def commands(self) -> List[str]:
        return self._commands

    @requires_version(2, 0)
    def clear_commands(self) -> None:
        self._commands.clear()
        if self._unsubscribe_commands:
            self._unsubscribe_commands()

        def on_command(message: cmd_types.CommandMessage) -> None:
            payload = message.get("payload")

            if payload is None:
                return

            text = payload.get("text")

            if text is None:
                return

            if message["$"] == "before":
                self._commands.append(text)

        self._unsubscribe_commands = self.broker.subscribe(
            cmd_types.COMMAND, on_command
        )

    @requires_version(2, 0)
    def is_simulating(self) -> bool:
        return self._core.is_simulating()

    @requires_version(2, 0)
    def load_labware_from_definition(
        self,
        labware_def: "LabwareDefinition",
        location: DeckLocation,
        label: Optional[str] = None,
    ) -> Labware:
        """Specify the presence of a piece of labware on the OT2 deck.

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
        load_params = self._core.add_labware_definition(labware_def)

        return self.load_labware(
            load_name=load_params.load_name,
            namespace=load_params.namespace,
            version=load_params.version,
            location=location,
            label=label,
        )

    @requires_version(2, 0)
    def load_labware(
        self,
        load_name: str,
        location: DeckLocation,
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: Optional[int] = None,
    ) -> Labware:
        """Load a labware onto the deck given its name.

        For labware already defined by Opentrons, this is a convenient way
        to collapse the two stages of labware initialization (creating
        the labware and adding it to the protocol) into one.

        This function returns the created and initialized labware for use
        later in the protocol.

        :param str load_name: A string to use for looking up a labware definition.
            You can find the ``load_name`` for any standard labware on the Opentrons
            `Labware Library <https://labware.opentrons.com>`_.

        :param location: The slot into which to load the labware,
            such as ``1`` or ``"1"``.

        :type location: int or str

        :param str label: An optional special name to give the labware. If specified, this
            is the name the labware will appear as in the run log and the calibration
            view in the Opentrons app.

        :param str namespace: The namespace that the labware definition belongs to.
            If unspecified, will search both:

              * ``"opentrons"``, to load standard Opentrons labware definitions.
              * ``"custom_beta"``, to load custom labware definitions created with the
                `Custom Labware Creator <https://labware.opentrons.com/create>`_.

            You might need to specify an explicit ``namespace`` if you have a custom
            definition whose ``load_name`` is the same as an Opentrons standard
            definition, and you want to explicitly choose one or the other.

        :param version: The version of the labware definition. You should normally
            leave this unspecified to let the implementation choose a good default.
        """
        load_name = validation.ensure_lowercase_name(load_name)
        deck_slot = validation.ensure_deck_slot(location)

        labware_core = self._core.load_labware(
            load_name=load_name,
            location=deck_slot,
            label=label,
            namespace=namespace,
            version=version,
        )

        labware = Labware(
            core=labware_core,
            api_version=self._api_version,
            protocol_core=self._core,
            core_map=self._core_map,
        )
        self._core_map.add(labware_core, labware)

        return labware

    @requires_version(2, 0)
    def load_labware_by_name(
        self,
        load_name: str,
        location: DeckLocation,
        label: Optional[str] = None,
        namespace: Optional[str] = None,
        version: int = 1,
    ) -> Labware:
        """
        .. deprecated:: 2.0
            Use :py:meth:`load_labware` instead.
        """
        logger.warning("load_labware_by_name is deprecated. Use load_labware instead.")
        return self.load_labware(load_name, location, label, namespace, version)

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_labwares(self) -> Dict[int, Labware]:
        """Get the labwares that have been loaded into the protocol context.

        Slots with nothing in them will not be present in the return value.

        .. note::

            If a module is present on the deck but no labware has been loaded
            into it with ``module.load_labware()``, there will
            be no entry for that slot in this value. That means you should not
            use ``loaded_labwares`` to determine if a slot is available or not,
            only to get a list of labwares. If you want a data structure of all
            objects on the deck regardless of type, see :py:attr:`deck`.


        :returns: Dict mapping deck slot number to labware, sorted in order of
                  the locations.
        """
        labware_cores = (
            (core.get_deck_slot(), core) for core in self._core.get_labware_cores()
        )

        return {
            slot.as_int(): self._core_map.get(core)
            for slot, core in labware_cores
            if slot is not None
        }

    # TODO (spp, 2022-12-14): https://opentrons.atlassian.net/browse/RLAB-237
    @requires_version(2, 15)
    def move_labware(
        self,
        labware: Labware,
        new_location: Union[DeckLocation, ModuleTypes, OffDeckType],
        use_gripper: bool = False,
        use_pick_up_location_lpc_offset: bool = False,
        use_drop_location_lpc_offset: bool = False,
        pick_up_offset: Optional[Mapping[str, float]] = None,
        drop_offset: Optional[Mapping[str, float]] = None,
    ) -> None:
        """Move a loaded labware to a new location.

        *** This API method is currently being developed. ***
        *** Expect changes without API level bump.        ***

        :param labware: Labware to move. Should be a labware already loaded
                        using :py:meth:`load_labware`

        :param new_location: Deck slot location or a hardware module that is already
                             loaded on the deck using :py:meth:`load_module`
                             or off deck using :py:obj:`OFF_DECK`.
        :param use_gripper: Whether to use gripper to perform this move.
                            If True, will use the gripper to perform the move (OT3 only).
                            If False, will pause protocol execution to allow the user
                            to perform a manual move and click resume to continue
                            protocol execution.

        Other experimental params:

        :param use_pick_up_location_lpc_offset: Whether to use LPC offset of the labware
                                                associated with its pick up location.
        :param use_drop_location_lpc_offset: Whether to use LPC offset of the labware
                                             associated with its drop off location.
        :param pick_up_offset: Offset to use when picking up labware.
        :param drop_offset: Offset to use when dropping off labware.

        Before moving a labware from or to a hardware module, make sure that the labware
        and its new location is reachable by the gripper. So, thermocycler lid should be
        open and heater-shaker's labware latch should be open.
        """
        # TODO (spp, 2022-10-31): re-evaluate whether to allow specifying `use_gripper`
        #  in the args or whether to have it specified in protocol requirements.

        if not isinstance(labware, Labware):
            raise ValueError(
                f"Expected labware of type 'Labware' but got {type(labware)}."
            )

        location: Union[ModuleCore, OffDeckType, DeckSlotName]
        if isinstance(new_location, ModuleContext):
            location = new_location._core
        elif isinstance(new_location, OffDeckType):
            location = new_location
        else:
            location = validation.ensure_deck_slot(new_location)

        _pick_up_offset = (
            validation.ensure_valid_labware_offset_vector(pick_up_offset)
            if pick_up_offset
            else None
        )
        _drop_offset = (
            validation.ensure_valid_labware_offset_vector(drop_offset)
            if drop_offset
            else None
        )
        self._core.move_labware(
            labware_core=labware._core,
            new_location=location,
            use_gripper=use_gripper,
            use_pick_up_location_lpc_offset=use_pick_up_location_lpc_offset,
            use_drop_location_lpc_offset=use_drop_location_lpc_offset,
            pick_up_offset=_pick_up_offset,
            drop_offset=_drop_offset,
        )

    @requires_version(2, 0)
    def load_module(
        self,
        module_name: str,
        location: Optional[DeckLocation] = None,
        configuration: Optional[str] = None,
    ) -> ModuleTypes:
        """Load a module onto the deck, given its name or model.

        This is the function to call to use a module in your protocol, like
        :py:meth:`load_instrument` is the method to call to use an instrument
        in your protocol. It returns the created and initialized module
        context, which will be a different class depending on the kind of
        module loaded.

        A map of deck positions to loaded modules can be accessed later
        by using :py:attr:`loaded_modules`.

        :param str module_name: The name or model of the module.
        :param location: The location of the module. This is usually the
                         name or number of the slot on the deck where you
                         will be placing the module. Some modules, like
                         the Thermocycler, are only valid in one deck
                         location. You do not have to specify a location
                         when loading a Thermocycler---it will always be
                         in Slot 7.
        :param configuration: Configure a thermocycler to be in the ``semi`` position.
                              This parameter does not work. Do not use it.

            .. versionchanged:: 2.14
                This parameter dangerously modified the protocol's geometry system,
                and it didn't function properly, so it was removed.

        :type location: str or int or None
        :returns: The loaded and initialized module---a
                  :py:class:`TemperatureModuleContext`,
                  :py:class:`MagneticModuleContext`,
                  :py:class:`ThermocyclerContext`, or
                  :py:class:`HeaterShakerContext`,
                  depending on what you requested with ``module_name``.

                  .. versionchanged:: 2.15
                    Added :py:class:`MagneticBlockContext` return value.
        """
        if configuration:
            if self._api_version < APIVersion(2, 4):
                raise APIVersionError(
                    f"You have specified API {self._api_version}, but you are"
                    "using Thermocycler parameters only available in 2.4"
                )
            if self._api_version >= ENGINE_CORE_API_VERSION:
                raise APIVersionError(
                    "The configuration parameter of load_module has been removed."
                )

        requested_model = validation.ensure_module_model(module_name)
        if isinstance(
            requested_model, MagneticBlockModel
        ) and self._api_version < APIVersion(2, 15):
            raise APIVersionError(
                f"Module of type {module_name} is only available in versions 2.15 and above."
            )

        deck_slot = None if location is None else validation.ensure_deck_slot(location)

        module_core = self._core.load_module(
            model=requested_model,
            deck_slot=deck_slot,
            configuration=configuration,
        )

        module_context = _create_module_context(
            module_core=module_core,
            protocol_core=self._core,
            core_map=self._core_map,
            broker=self._broker,
            api_version=self._api_version,
        )

        self._core_map.add(module_core, module_context)

        return module_context

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_modules(self) -> Dict[int, ModuleTypes]:
        """Get the modules loaded into the protocol context.

        This is a map of deck positions to modules loaded by previous calls
        to :py:meth:`load_module`. It is not necessarily the same as the
        modules attached to the robot - for instance, if the robot has a
        Magnetic Module and a Temperature Module attached, but the protocol
        has only loaded the Temperature Module with :py:meth:`load_module`,
        only the Temperature Module will be present.

        :returns Dict[int, ModuleContext]: Dict mapping slot name to module
                                           contexts. The elements may not be
                                           ordered by slot number.
        """
        return {
            core.get_deck_slot().as_int(): self._core_map.get(core)
            for core in self._core.get_module_cores()
        }

    @requires_version(2, 0)
    def load_instrument(
        self,
        instrument_name: str,
        mount: Union[Mount, str],
        tip_racks: Optional[List[Labware]] = None,
        replace: bool = False,
    ) -> InstrumentContext:
        """Load a specific instrument required by the protocol.

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
        instrument_name = validation.ensure_lowercase_name(instrument_name)
        is_96_channel = instrument_name == "p1000_96"
        if is_96_channel and isinstance(self._core, ProtocolEngineCore):
            checked_instrument_name = instrument_name
            checked_mount = Mount.LEFT
        else:
            checked_instrument_name = validation.ensure_pipette_name(instrument_name)
            checked_mount = validation.ensure_mount(mount)

        tip_racks = tip_racks or []

        existing_instrument = self._instruments[checked_mount]
        if existing_instrument is not None and not replace:
            # TODO(mc, 2022-08-25): create specific exception type
            raise RuntimeError(
                f"Instrument already present on {checked_mount.name.lower()}:"
                f" {existing_instrument.name}"
            )

        logger.info(
            f"Loading {checked_instrument_name} on {checked_mount.name.lower()} mount"
        )

        # TODO (tz, 11-22-22): was added to support 96 channel pipette.
        #  Should remove when working on https://opentrons.atlassian.net/browse/RLIQ-255
        instrument_core = self._core.load_instrument(
            instrument_name=checked_instrument_name,  # type: ignore[arg-type]
            mount=checked_mount,
        )

        for tip_rack in tip_racks:
            instrument_support.validate_tiprack(
                instrument_name=instrument_core.get_pipette_name(),
                tip_rack=tip_rack,
                log=logger,
            )

        instrument = InstrumentContext(
            core=instrument_core,
            protocol_core=self._core,
            broker=self._broker,
            api_version=self._api_version,
            tip_racks=tip_racks,
            trash=self.fixed_trash,
            requested_as=instrument_name,
        )

        self._instruments[checked_mount] = instrument

        return instrument

    @property  # type: ignore
    @requires_version(2, 0)
    def loaded_instruments(self) -> Dict[str, InstrumentContext]:
        """Get the instruments that have been loaded into the protocol.

        This is a map of mount name to instruments previously loaded with
        :py:meth:`load_instrument`. It is not necessarily the same as the
        instruments attached to the robot - for instance, if the robot has
        an instrument in both mounts but your protocol has only loaded one
        of them with :py:meth:`load_instrument`, the unused one will not
        be present.

        :returns: A dict mapping mount name
                  (``'left'`` or ``'right'``)
                  to the instrument in that mount.
                  If a mount has no loaded instrument,
                  that key will be missing from the dict.
        """
        return {
            mount.name.lower(): instr
            for mount, instr in self._instruments.items()
            if instr
        }

    @publish(command=cmds.pause)
    @requires_version(2, 0)
    def pause(self, msg: Optional[str] = None) -> None:
        """Pause execution of the protocol until it's resumed.

        A human can resume the protocol through the Opentrons App.

        This function returns immediately, but the next function call that
        is blocked by a paused robot (anything that involves moving) will
        not return until the protocol is resumed.

        :param str msg: An optional message to show to connected clients. The
            Opentrons App will show this in the run log.
        """
        self._core.pause(msg=msg)

    @publish(command=cmds.resume)
    @requires_version(2, 0)
    def resume(self) -> None:
        """Resume the protocol after :py:meth:`pause`.

        .. deprecated:: 2.12
           The Python Protocol API supports no safe way for a protocol to resume itself.
           See https://github.com/Opentrons/opentrons/issues/8209.
           If you're looking for a way for your protocol to resume automatically
           after a period of time, use :py:meth:`delay`.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "A Python Protocol cannot safely resume itself after a pause."
                " To wait automatically for a period of time, use ProtocolContext.delay()."
            )

        # TODO(mc, 2023-02-13): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyProtocolCore)
        cast(LegacyProtocolCore, self._core).resume()

    @publish(command=cmds.comment)
    @requires_version(2, 0)
    def comment(self, msg: str) -> None:
        """
        Add a user-readable comment string that will be echoed to the Opentrons
        app.

        The value of the message is computed during protocol simulation,
        so cannot be used to communicate real-time information from the robot's
        actual run.
        """
        self._core.comment(msg=msg)

    @publish(command=cmds.delay)
    @requires_version(2, 0)
    def delay(
        self,
        seconds: float = 0,
        minutes: float = 0,
        msg: Optional[str] = None,
    ) -> None:
        """Delay protocol execution for a specific amount of time.

        :param float seconds: A time to delay in seconds
        :param float minutes: A time to delay in minutes

        If both `seconds` and `minutes` are specified, they will be added.
        """
        delay_time = seconds + minutes * 60
        self._core.delay(seconds=delay_time, msg=msg)

    @requires_version(2, 0)
    def home(self) -> None:
        """Homes the robot."""
        self._core.home()

    @property
    def location_cache(self) -> Optional[Location]:
        """The cache used by the robot to determine where it last was."""
        return self._core.get_last_location()

    @location_cache.setter
    def location_cache(self, loc: Optional[Location]) -> None:
        self._core.set_last_location(loc)

    @property  # type: ignore
    @requires_version(2, 0)
    def deck(self) -> Deck:
        """An interface to provide information about the current deck layout.

        This object behaves like a dictionary with keys for both numeric
        and string slot numbers - for instance, ``protocol.deck[1]`` and
        ``protocol.deck['1']`` will both return the object in slot 1. If
        nothing is loaded into a slot, ``None`` will be present.

        This object is useful for determining if a slot in the deck is free.
        Rather than filtering the objects in the deck map yourself,
        you can also use :py:attr:`loaded_labwares` to see a dict of labwares
        and :py:attr:`loaded_modules` to see a dict of modules.

        For advanced control you can delete an item of labware from the deck
        with e.g. ``del protocol.deck['1']`` to free a slot for new labware.
        """
        return self._deck

    @property  # type: ignore
    @requires_version(2, 0)
    def fixed_trash(self) -> Labware:
        """The trash fixed to slot 12 of the robot deck.

        It has one well and should be accessed like labware in your protocol.
        e.g. ``protocol.fixed_trash['A1']``
        """
        return self._core_map.get(self._core.fixed_trash)

    def _load_fixed_trash(self) -> None:
        fixed_trash_core = self._core.fixed_trash
        fixed_trash = Labware(
            core=fixed_trash_core,
            api_version=self._api_version,
            protocol_core=self._core,
            core_map=self._core_map,
        )
        self._core_map.add(fixed_trash_core, fixed_trash)

    @requires_version(2, 5)
    def set_rail_lights(self, on: bool) -> None:
        """
        Controls the robot rail lights

        :param bool on: If true, turn on rail lights; otherwise, turn off.
        """
        self._core.set_rail_lights(on=on)

    @requires_version(2, 14)
    def define_liquid(
        self, name: str, description: Optional[str], display_color: Optional[str]
    ) -> Liquid:
        """
        Define a liquid within a protocol.

        :param str name: A human-readable name for the liquid.
        :param str description: An optional description of the liquid.
        :param str display_color: An optional hex color code, with hash included, to represent the specified liquid. Standard three-value, four-value, six-value, and eight-value syntax are all acceptable.

        :return: A :py:class:`~opentrons.protocol_api.Liquid` object representing the specified liquid.
        """
        return self._core.define_liquid(
            name=name,
            description=description,
            display_color=display_color,
        )

    @property  # type: ignore
    @requires_version(2, 5)
    def rail_lights_on(self) -> bool:
        """Returns True if the rail lights are on"""
        return self._core.get_rail_lights_on()

    @property  # type: ignore
    @requires_version(2, 5)
    def door_closed(self) -> bool:
        """Returns True if the robot door is closed"""
        return self._core.door_closed()


def _create_module_context(
    module_core: Union[ModuleCore, NonConnectedModuleCore],
    protocol_core: ProtocolCore,
    core_map: LoadedCoreMap,
    api_version: APIVersion,
    broker: Broker,
) -> ModuleTypes:
    module_cls: Optional[Type[ModuleTypes]] = None
    if isinstance(module_core, AbstractTemperatureModuleCore):
        module_cls = TemperatureModuleContext
    elif isinstance(module_core, AbstractMagneticModuleCore):
        module_cls = MagneticModuleContext
    elif isinstance(module_core, AbstractThermocyclerCore):
        module_cls = ThermocyclerContext
    elif isinstance(module_core, AbstractHeaterShakerCore):
        module_cls = HeaterShakerContext
    elif isinstance(module_core, AbstractMagneticBlockCore):
        module_cls = MagneticBlockContext
    else:
        assert False, "Unsupported module type"

    return module_cls(
        core=module_core,
        protocol_core=protocol_core,
        core_map=core_map,
        api_version=api_version,
        broker=broker,
    )
