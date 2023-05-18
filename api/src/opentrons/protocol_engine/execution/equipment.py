"""Equipment command side-effect logic."""
from dataclasses import dataclass
from typing import Optional, overload, Union
from typing_extensions import Literal

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import MountType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import (
    AbstractModule,
    MagDeck,
    HeaterShaker,
    TempDeck,
    Thermocycler,
)
from opentrons.protocol_engine.state.module_substates import (
    MagneticModuleId,
    HeaterShakerModuleId,
    TemperatureModuleId,
    ThermocyclerModuleId,
)
from ..actions import ActionDispatcher, AddPipetteConfigAction
from ..errors import (
    FailedToLoadPipetteError,
    LabwareDefinitionDoesNotExistError,
    ModuleNotAttachedError,
)
from ..resources import (
    LabwareDataProvider,
    ModuleDataProvider,
    ModelUtils,
    pipette_data_provider,
)
from ..state import StateStore, HardwareModule
from ..types import (
    LabwareLocation,
    DeckSlotLocation,
    ModuleLocation,
    LabwareOffset,
    LabwareOffsetLocation,
    ModuleModel,
    ModuleDefinition,
)


@dataclass(frozen=True)
class LoadedLabwareData:
    """The result of a load labware procedure."""

    labware_id: str
    definition: LabwareDefinition
    offsetId: Optional[str]


@dataclass(frozen=True)
class LoadedPipetteData:
    """The result of a load pipette procedure."""

    pipette_id: str


@dataclass(frozen=True)
class LoadedModuleData:
    """The result of a load module procedure."""

    module_id: str
    serial_number: Optional[str]
    definition: ModuleDefinition


class EquipmentHandler:
    """Implementation logic for labware, pipette, and module loading."""

    _hardware_api: HardwareControlAPI
    _state_store: StateStore
    _labware_data_provider: LabwareDataProvider
    _module_data_provider: ModuleDataProvider
    _model_utils: ModelUtils

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        action_dispatcher: ActionDispatcher,
        labware_data_provider: Optional[LabwareDataProvider] = None,
        module_data_provider: Optional[ModuleDataProvider] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize an EquipmentHandler instance."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher
        self._labware_data_provider = labware_data_provider or LabwareDataProvider()
        self._module_data_provider = module_data_provider or ModuleDataProvider()
        self._model_utils = model_utils or ModelUtils()

    async def load_labware(
        self,
        load_name: str,
        namespace: str,
        version: int,
        location: LabwareLocation,
        labware_id: Optional[str],
    ) -> LoadedLabwareData:
        """Load labware by assigning an identifier and pulling required data.

        Args:
            load_name: The labware's load name.
            namespace: The labware's namespace.
            version: The labware's version.
            location: The deck location at which labware is placed.
            labware_id: An optional identifier to assign the labware. If None, an
                identifier will be generated.

        Raises:
            ModuleNotLoadedError: If `location` references a module ID
                that doesn't point to a valid loaded module.

        Returns:
            A LoadedLabwareData object.
        """
        labware_id = (
            labware_id if labware_id is not None else self._model_utils.generate_id()
        )

        definition_uri = uri_from_details(
            load_name=load_name,
            namespace=namespace,
            version=version,
        )

        try:
            # Try to use existing definition in state.
            definition = self._state_store.labware.get_definition_by_uri(definition_uri)
        except LabwareDefinitionDoesNotExistError:
            definition = await self._labware_data_provider.get_labware_definition(
                load_name=load_name,
                namespace=namespace,
                version=version,
            )

        # Allow propagation of ModuleNotLoadedError.
        offset_id = self.find_applicable_labware_offset_id(
            labware_definition_uri=definition_uri,
            labware_location=location,
        )

        return LoadedLabwareData(
            labware_id=labware_id, definition=definition, offsetId=offset_id
        )

    async def load_pipette(
        self,
        pipette_name: Union[PipetteNameType, Literal["p1000_96"]],
        mount: MountType,
        pipette_id: Optional[str],
    ) -> LoadedPipetteData:
        """Ensure the requested pipette is attached.

        Args:
            pipette_name: The pipette name.
            mount: The mount on which pipette must be attached.
            pipette_id: An optional identifier to assign the pipette. If None, an
                identifier will be generated.

        Returns:
            A LoadedPipetteData object.
        """
        # TODO (spp, 2023-05-10): either raise error if using MountType.EXTENSION in
        #  load pipettes command, or change the mount type used to be a restricted
        #  PipetteMountType which has only pipette mounts and not the extension mount.
        use_virtual_pipettes = self._state_store.config.use_virtual_pipettes

        pipette_name_value = (
            pipette_name.value
            if isinstance(pipette_name, PipetteNameType)
            else pipette_name
        )

        pipette_id = pipette_id or self._model_utils.generate_id()

        if not use_virtual_pipettes:
            cache_request = {mount.to_hw_mount(): pipette_name_value}

            # TODO(mc, 2022-12-09): putting the other pipette in the cache request
            # is only to support protocol analysis, since the hardware simulator
            # does not cache requested virtual instruments. Remove per
            # https://opentrons.atlassian.net/browse/RLIQ-258
            other_mount = mount.other_mount()
            other_pipette = self._state_store.pipettes.get_by_mount(other_mount)
            if other_pipette is not None:
                cache_request[other_mount.to_hw_mount()] = (
                    other_pipette.pipetteName.value
                    if isinstance(other_pipette.pipetteName, PipetteNameType)
                    else other_pipette.pipetteName
                )

            # TODO(mc, 2020-10-18): calling `cache_instruments` mirrors the
            # behavior of protocol_context.load_instrument, and is used here as a
            # pipette existence check
            try:
                await self._hardware_api.cache_instruments(cache_request)
            except RuntimeError as e:
                raise FailedToLoadPipetteError(str(e)) from e

            pipette_dict = self._hardware_api.get_attached_instrument(
                mount.to_hw_mount()
            )

            serial_number = pipette_dict["pipette_id"]
            static_pipette_config = pipette_data_provider.get_pipette_static_config(
                pipette_dict
            )

        else:
            serial_number = self._model_utils.generate_id(prefix="fake-serial-number-")
            static_pipette_config = (
                pipette_data_provider.get_virtual_pipette_static_config(
                    pipette_name_value
                )
            )

        # TODO(mc, 2023-02-22): rather than dispatch from inside the load command
        # see if additional config data like this can be returned from the command impl
        # alongside, but outside of, the command result.
        # this pattern could potentially improve `loadLabware` and `loadModule`, too
        self._action_dispatcher.dispatch(
            AddPipetteConfigAction(
                pipette_id=pipette_id,
                serial_number=serial_number,
                config=static_pipette_config,
            )
        )

        return LoadedPipetteData(pipette_id=pipette_id)

    async def load_magnetic_block(
        self,
        model: ModuleModel,
        location: DeckSlotLocation,
        module_id: Optional[str],
    ) -> LoadedModuleData:
        """Ensure the required magnetic block is attached.

        Args:
            model: The model name of the module.
            location: The deck location of the module
            module_id: Optional ID assigned to the module.
                       If None, an ID will be generated.

        Returns:
            A LoadedModuleData object.

        Raises:
            ModuleAlreadyPresentError: A module of a different type is already
                assigned to the requested location.
        """
        assert ModuleModel.is_magnetic_block(
            model
        ), f"Expected Magnetic block and got {model.name}"
        definition = self._module_data_provider.get_definition(model)
        # when loading a hardware module select_hardware_module_to_load
        # will ensure a module of a different type is not loaded at the same slot.
        # this is for non-connected modules.
        self._state_store.modules.raise_if_module_in_location(location=location)
        return LoadedModuleData(
            module_id=self._model_utils.ensure_id(module_id),
            serial_number=None,
            definition=definition,
        )

    async def load_module(
        self,
        model: ModuleModel,
        location: DeckSlotLocation,
        module_id: Optional[str],
    ) -> LoadedModuleData:
        """Ensure the required module is attached.

        Args:
            model: The model name of the module.
            location: The deck location of the module
            module_id: Optional ID assigned to the module.
                       If None, an ID will be generated.

        Returns:
            A LoadedModuleData object.

        Raises:
            ModuleNotAttachedError: A not-yet-assigned module matching the requested
                parameters could not be found in the attached modules list.
            ModuleAlreadyPresentError: A module of a different type is already
                assigned to the requested location.
        """
        # TODO(mc, 2022-02-09): validate module location given deck definition
        use_virtual_modules = self._state_store.config.use_virtual_modules

        if not use_virtual_modules:
            attached_modules = [
                HardwareModule(
                    serial_number=hw_mod.device_info["serial"],
                    definition=self._module_data_provider.get_definition(
                        ModuleModel(hw_mod.model())
                    ),
                )
                for hw_mod in self._hardware_api.attached_modules
            ]

            attached_module = self._state_store.modules.select_hardware_module_to_load(
                model=model,
                location=location,
                attached_modules=attached_modules,
            )

        else:
            attached_module = HardwareModule(
                serial_number=self._model_utils.generate_id(
                    prefix="fake-serial-number-"
                ),
                definition=self._module_data_provider.get_definition(model),
            )

        return LoadedModuleData(
            module_id=self._model_utils.ensure_id(module_id),
            serial_number=attached_module.serial_number,
            definition=attached_module.definition,
        )

    @overload
    def get_module_hardware_api(
        self,
        module_id: MagneticModuleId,
    ) -> Optional[MagDeck]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: HeaterShakerModuleId,
    ) -> Optional[HeaterShaker]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: TemperatureModuleId,
    ) -> Optional[TempDeck]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: ThermocyclerModuleId,
    ) -> Optional[Thermocycler]:
        ...

    def get_module_hardware_api(self, module_id: str) -> Optional[AbstractModule]:
        """Get the hardware API for a given module."""
        use_virtual_modules = self._state_store.config.use_virtual_modules
        if use_virtual_modules:
            return None

        attached_modules = self._hardware_api.attached_modules
        serial_number = self._state_store.modules.get_serial_number(module_id)
        for mod in attached_modules:
            if mod.device_info["serial"] == serial_number:
                return mod

        raise ModuleNotAttachedError(
            f'No module attached with serial number "{serial_number}"'
            f' for module ID "{module_id}".'
        )

    def find_applicable_labware_offset_id(
        self, labware_definition_uri: str, labware_location: LabwareLocation
    ) -> Optional[str]:
        """Figure out what offset would apply to a labware in the given location.

        Raises:
            ModuleNotLoadedError: If `labware_location` references a module ID
                that doesn't point to a valid loaded module.

        Returns:
            The ID of the labware offset that will apply,
            or None if no labware offset will apply.
        """
        if isinstance(labware_location, DeckSlotLocation):
            offset = self._state_store.labware.find_applicable_labware_offset(
                definition_uri=labware_definition_uri,
                location=LabwareOffsetLocation(
                    slotName=labware_location.slotName,
                    moduleModel=None,
                ),
            )
            return self._get_id_from_offset(offset)

        elif isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            # Allow ModuleNotLoadedError to propagate.
            # Note also that we match based on the module's requested model, not its
            # actual model, to implement robot-server's documented HTTP API semantics.
            module_model = self._state_store.modules.get_requested_model(
                module_id=module_id
            )

            # If `module_model is None`, it probably means that this module was added by
            # `ProtocolEngine.use_attached_modules()`, instead of an explicit
            # `loadModule` command.
            #
            # This assert should never raise in practice because:
            #   1. `ProtocolEngine.use_attached_modules()` is only used by
            #      robot-server's "stateless command" endpoints, under `/commands`.
            #   2. Those endpoints don't support loading labware, so this code will
            #      never run.
            #
            # Nevertheless, if it does happen somehow, we do NOT want to pass the
            # `None` value along to `LabwareView.find_applicable_labware_offset()`.
            # `None` means something different there, which will cause us to return
            # wrong results.
            assert module_model is not None, (
                "Can't find offsets for labware"
                " that are loaded on modules"
                " that were loaded with ProtocolEngine.use_attached_modules()."
            )

            module_location = self._state_store.modules.get_location(
                module_id=module_id
            )
            slot_name = module_location.slotName
            offset = self._state_store.labware.find_applicable_labware_offset(
                definition_uri=labware_definition_uri,
                location=LabwareOffsetLocation(
                    slotName=slot_name,
                    moduleModel=module_model,
                ),
            )
            return self._get_id_from_offset(offset)

        else:
            # No offset for off-deck location.
            # Returning None instead of raising an exception allows loading a labware
            # with 'offDeck' as valid location.
            # Also allows using `moveLabware` with 'offDeck' location.
            return None

    @staticmethod
    def _get_id_from_offset(labware_offset: Optional[LabwareOffset]) -> Optional[str]:
        return None if labware_offset is None else labware_offset.id
