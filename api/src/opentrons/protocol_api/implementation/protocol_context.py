import asyncio
import contextlib
import logging
from typing import Dict, Optional, Union, List, Iterator, Tuple, Set

from opentrons import types, API, commands as cmds
from opentrons.config import feature_flags as fflags
from opentrons.commands import CommandPublisher
from opentrons.hardware_control import ExecutionManager, SynchronousAdapter, \
    modules
from opentrons.protocol_api import InstrumentContext, MAX_SUPPORTED_VERSION, \
    geometry
from opentrons.protocol_api.geometry import Deck
from opentrons.protocol_api.implementation.interfaces.protocol_context import \
    AbstractProtocolContext
from opentrons.protocol_api.implementation.location_cache import LocationCache
from opentrons.protocol_api.labware import Labware, load_from_definition, \
    get_labware_definition
from opentrons.protocol_api.module_contexts import ModuleContext, \
    ThermocyclerContext, MagneticModuleContext, TemperatureModuleContext, \
    ModuleTypes
from opentrons.protocol_api.module_geometry import ModuleGeometry, \
    resolve_module_model, resolve_module_type, load_module, ModuleType, \
    models_compatible, module_model_from_string
from opentrons.protocol_api.util import AxisMaxSpeeds, HardwareToManage, \
    HardwareManager, convert_door_state_to_bool, APIVersionError
from opentrons.protocols.types import APIVersion, Protocol
from opentrons_shared_data.labware import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)

SHORT_TRASH_DECK = 'ot2_short_trash'
STANDARD_DECK = 'ot2_standard'


class ProtocolContextImplementation(AbstractProtocolContext, CommandPublisher):

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None,
                 hardware: HardwareToManage = None,
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
        deck_load_name = SHORT_TRASH_DECK if fflags.short_fixed_trash() \
            else STANDARD_DECK
        self._deck_layout = geometry.Deck(load_name=deck_load_name)
        self._instruments: Dict[types.Mount, Optional[InstrumentContext]] \
            = {mount: None for mount in types.Mount}
        self._modules: Set[ModuleContext] = set()
        self._last_moved_instrument: Optional[types.Mount] = None
        self._location_cache = LocationCache()

        self._hw_manager = HardwareManager(hardware)
        self._log = MODULE_LOG.getChild(self.__class__.__name__)
        self._commands: List[str] = []
        self._unsubscribe_commands = None
        self.clear_commands()

        self._bundled_labware = bundled_labware
        self._extra_labware = extra_labware or {}

        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._default_max_speeds = AxisMaxSpeeds()

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

    def get_api_version(self) -> APIVersion:
        return self._api_version

    def get_bundled_data(self) -> Dict[str, bytes]:
        return self._bundled_data

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        return self._bundled_labware

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        return self._extra_labware

    def cleanup(self) -> None:
        if self._unsubscribe_commands:
            self._unsubscribe_commands()
            self._unsubscribe_commands = None

    def __del__(self):
        if getattr(self, '_unsubscribe_commands', None):
            self._unsubscribe_commands()  # type: ignore

    def get_max_speeds(self) -> AxisMaxSpeeds:
        return self._default_max_speeds

    def get_commands(self) -> List[str]:
        return self._commands

    def clear_commands(self) -> None:
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

    def get_hardware(self) -> HardwareManager:
        return self._hw_manager

    @contextlib.contextmanager
    def temp_connect(self, hardware: API):
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

    def connect(self, hardware: API) -> None:
        self._hw_manager.set_hw(hardware)
        self._hw_manager.hardware.cache_instruments()

    def disconnect(self) -> None:
        self._hw_manager.reset_hw()

    def is_simulating(self) -> bool:
        return self._hw_manager.hardware.is_simulator

    def load_labware_from_definition(self, labware_def: LabwareDefinition,
                                     location: types.DeckLocation,
                                     label: str = None) -> Labware:
        parent = self.get_deck().position_for(location)
        labware_obj = load_from_definition(labware_def, parent, label)
        self._deck_layout[location] = labware_obj
        return labware_obj

    def load_labware(self, load_name: str, location: types.DeckLocation,
                     label: str = None, namespace: str = None,
                     version: int = None) -> Labware:
        labware_def = get_labware_definition(
            load_name, namespace, version,
            bundled_defs=self._bundled_labware,
            extra_defs=self._extra_labware)
        return self.load_labware_from_definition(
            labware_def, location, label)

    def get_loaded_labwares(self) -> Dict[int, Union[Labware, ModuleGeometry]]:
        def _only_labwares() -> Iterator[
            Tuple[int, Union[Labware, ModuleGeometry]]
        ]:
            for slotnum, slotitem in self._deck_layout.items():
                if isinstance(slotitem, Labware):
                    yield slotnum, slotitem
                elif isinstance(slotitem, ModuleGeometry):
                    if slotitem.labware:
                        yield slotnum, slotitem.labware

        return dict(_only_labwares())

    def load_module(self, module_name: str,
                    location: Optional[types.DeckLocation] = None,
                    configuration: str = None) -> ModuleTypes:
        resolved_model = resolve_module_model(module_name)
        resolved_type = resolve_module_type(resolved_model)
        resolved_location = self._deck_layout.resolve_module_location(
            resolved_type, location)
        if self._api_version < APIVersion(2, 4) and configuration:
            raise APIVersionError(
                f'You have specified API {self._api_version}, but you are'
                'using thermocycler parameters only available in 2.4')

        geometry = load_module(
            resolved_model,
            self._deck_layout.position_for(
                resolved_location),
            self._api_version, configuration)

        hc_mod_instance = None
        mod_class = {
            ModuleType.MAGNETIC: MagneticModuleContext,
            ModuleType.TEMPERATURE: TemperatureModuleContext,
            ModuleType.THERMOCYCLER: ThermocyclerContext}[resolved_type]
        for mod in self._hw_manager.hardware.attached_modules:
            if models_compatible(
                    module_model_from_string(mod.model()), resolved_model):
                hc_mod_instance = SynchronousAdapter(mod)
                break

        if self.is_simulating() and hc_mod_instance is None:
            mod_type = {
                ModuleType.MAGNETIC: modules.magdeck.MagDeck,
                ModuleType.TEMPERATURE: modules.tempdeck.TempDeck,
                ModuleType.THERMOCYCLER: modules.thermocycler.Thermocycler
            }[resolved_type]
            hc_mod_instance = SynchronousAdapter(mod_type(
                port='',
                simulating=True,
                loop=self._hw_manager.hardware.loop,
                execution_manager=ExecutionManager(
                    loop=self._hw_manager.hardware.loop),
                sim_model=resolved_model.value))
            hc_mod_instance._connect()
        if hc_mod_instance:
            mod_ctx = mod_class(self,
                                hc_mod_instance,
                                geometry,
                                self.get_api_version(),
                                self._loop)
        else:
            raise RuntimeError(
                f'Could not find specified module: {module_name}')
        self._modules.add(mod_ctx)
        self._deck_layout[resolved_location] = geometry
        return mod_ctx

    def get_loaded_modules(self) -> Dict[int, ModuleContext]:
        def _modules() -> Iterator[Tuple[int, 'ModuleContext']]:
            for module in self._modules:
                yield int(module.geometry.parent), module

        return dict(_modules())

    def load_instrument(self, instrument_name: str,
                        mount: types.Mount,
                        tip_racks: List[Labware] = None,
                        replace: bool = False) -> InstrumentContext:
        checked_mount = mount
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
            broker=self.broker,
            location_cache=self._location_cache,
            hardware_mgr=self._hw_manager,
            mount=checked_mount,
            at_version=self._api_version,
            tip_racks=tip_racks,
            log_parent=self._log,
            requested_as=instrument_name)
        self._instruments[checked_mount] = new_instr
        self._log.info("Instrument {} loaded".format(new_instr))
        return new_instr

    def get_loaded_instruments(self) -> Dict[str, Optional[InstrumentContext]]:
        return {mount.name.lower(): instr for mount, instr
                in self._instruments.items()
                if instr}

    @cmds.publish.both(command=cmds.pause)
    def pause(self, msg: str = None) -> None:
        self._hw_manager.hardware.pause()

    @cmds.publish.both(command=cmds.resume)
    def resume(self) -> None:
        self._hw_manager.hardware.resume()

    @cmds.publish.both(command=cmds.comment)
    def comment(self, msg: str) -> None:
        pass

    @cmds.publish.both(command=cmds.delay)
    def delay(self, seconds=0, msg: str = None) -> None:
        self._hw_manager.hardware.delay(seconds)

    def home(self) -> None:
        self._log.debug("home")
        self._location_cache.clear()
        self._hw_manager.hardware.home()

    def get_deck(self) -> Deck:
        return self._deck_layout

    def get_fixed_trash(self) -> Labware:
        trash = self._deck_layout['12']
        if not trash:
            raise RuntimeError("Robot must have a trash container in 12")
        return trash  # type: ignore

    def set_rail_lights(self, on: bool) -> None:
        self._hw_manager.hardware.set_lights(rails=on)

    def get_rail_lights_on(self) -> bool:
        return self._hw_manager.hardware.get_lights()['rails']

    def door_closed(self) -> bool:
        return convert_door_state_to_bool(
            self._hw_manager.hardware.door_state)
