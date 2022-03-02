"""Equipment command side-effect logic."""
from dataclasses import dataclass
from typing import Optional

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import MountType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule, MagDeck

from ..errors import (
    FailedToLoadPipetteError,
    LabwareDefinitionDoesNotExistError,
    ModuleNotAttachedError,
    WrongModuleTypeError,
)
from ..resources import LabwareDataProvider, ModuleDataProvider, ModelUtils
from ..state import StateStore, HardwareModule
from ..types import (
    LabwareLocation,
    PipetteName,
    DeckSlotLocation,
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
    serial_number: str
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
        labware_data_provider: Optional[LabwareDataProvider] = None,
        module_data_provider: Optional[ModuleDataProvider] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize an EquipmentHandler instance."""
        self._hardware_api = hardware_api
        self._state_store = state_store
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
            namespace: The namespace.
            version: Version
            location: The deck location at which labware is placed.
            labware_id: An optional identifier to assign the labware. If None, an
                identifier will be generated.

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

        if isinstance(location, DeckSlotLocation):
            slot_name = location.slotName
            module_model = None
        else:
            module = self._state_store.modules.get(location.moduleId)
            slot_name = module.location.slotName
            module_model = module.model

        offset = self._state_store.labware.find_applicable_labware_offset(
            definition_uri=definition_uri,
            location=LabwareOffsetLocation(
                slotName=slot_name,
                moduleModel=module_model,
            ),
        )

        return LoadedLabwareData(
            labware_id=labware_id,
            definition=definition,
            offsetId=(None if offset is None else offset.id),
        )

    async def load_pipette(
        self,
        pipette_name: PipetteName,
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
        other_mount = mount.other_mount()
        other_pipette = self._state_store.pipettes.get_by_mount(other_mount)

        cache_request = {mount.to_hw_mount(): pipette_name}
        if other_pipette is not None:
            cache_request[other_mount.to_hw_mount()] = other_pipette.pipetteName

        # TODO(mc, 2020-10-18): calling `cache_instruments` mirrors the
        # behavior of protocol_context.load_instrument, and is used here as a
        # pipette existence check
        # TODO(mc, 2021-04-16): reconcile PipetteName enum with PipetteName union
        try:
            await self._hardware_api.cache_instruments(
                cache_request  # type: ignore[arg-type]
            )
        except RuntimeError as e:
            raise FailedToLoadPipetteError(str(e)) from e

        pipette_id = pipette_id or self._model_utils.generate_id()

        return LoadedPipetteData(pipette_id=pipette_id)

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
        use_virtual_modules = self._state_store.get_configs().use_virtual_modules

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
                # TODO(mc, 2022-02-14): use something a little more obvious
                # than an opaque UUID for the virtual serial number
                serial_number=self._model_utils.generate_id(),
                definition=self._module_data_provider.get_definition(model),
            )

        return LoadedModuleData(
            module_id=self._model_utils.ensure_id(module_id),
            serial_number=attached_module.serial_number,
            definition=attached_module.definition,
        )

    # To do: Move these 3 to ModuleView.
    def _get_attached_module(self, serial_number: str) -> AbstractModule:
        for attached_hardware_module in self._hardware_api.attached_modules:
            if attached_hardware_module.device_info["serial"] == serial_number:
                return attached_hardware_module
        raise ModuleNotAttachedError(
            f'No module attached with serial number "{serial_number}".'
        )

    def _get_attached_magnetic_module(self, serial_number: str) -> MagDeck:
        attached_module = self._get_attached_module(serial_number=serial_number)
        if not isinstance(attached_module, MagDeck):
            raise WrongModuleTypeError(
                f"Module {serial_number} is a {type(attached_module)},"
                f" not a Magnetic Module."
            )
        return attached_module

    async def engage_magnets(
        self,
        magnetic_module_id: str,
        mm_above_labware_base: float,
    ) -> None:
        """Engage a loaded Magnetic Module's magnets."""
        # Will raise if the given module ID hasn't been loaded.
        model = self._state_store.modules.get_model(module_id=magnetic_module_id)

        # Will raise if either:
        #   * The given module ID points to a module that's not a Magnetic Module.
        #   * The given height is invalid.
        hardware_height = self._state_store.modules.calculate_magnet_hardware_height(
            magnetic_module_model=model,
            mm_above_labware_base=mm_above_labware_base,
        )

        if not self._state_store.get_configs().use_virtual_modules:
            serial_number = self._state_store.modules.get_serial_number(
                module_id=magnetic_module_id
            )
            hardware_module = self._get_attached_magnetic_module(
                serial_number=serial_number
            )
            await hardware_module.engage(height=hardware_height)
