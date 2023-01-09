"""Test equipment command execution side effects."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from typing import Any, cast

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareUri

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.types import Mount as HwMount, MountType, DeckSlotName
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import (
    TempDeck,
    MagDeck,
    HeaterShaker,
    AbstractModule,
)
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.actions import ActionDispatcher, AddPipetteConfigAction
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleLocation,
    LoadedPipette,
    LabwareOffset,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    ModuleModel,
    ModuleDefinition,
    OFF_DECK_LOCATION,
)

from opentrons.protocol_engine.state import Config, StateStore
from opentrons.protocol_engine.state.modules import HardwareModule
from opentrons.protocol_engine.resources import (
    ModelUtils,
    LabwareDataProvider,
    ModuleDataProvider,
)
from opentrons.protocol_engine.execution.equipment import (
    EquipmentHandler,
    LoadedLabwareData,
    LoadedPipetteData,
    LoadedModuleData,
)


def _make_config(use_virtual_modules: bool) -> Config:
    return Config(
        use_virtual_modules=use_virtual_modules,
        robot_type="OT-2 Standard",  # Arbitrary.
    )


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore instance."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mocked out HardwareControlAPI instance."""
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out ActionDispatcher instance."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mocked out ModelUtils instance."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def labware_data_provider(decoy: Decoy) -> LabwareDataProvider:
    """Get a mocked out LabwareDataProvider instance."""
    return decoy.mock(cls=LabwareDataProvider)


@pytest.fixture
def module_data_provider(decoy: Decoy) -> ModuleDataProvider:
    """Get a mocked out ModuleDataProvider instance."""
    return decoy.mock(cls=ModuleDataProvider)


@pytest.fixture
async def temp_module_v1(decoy: Decoy) -> TempDeck:
    """Get a mocked out module fixture."""
    temp_mod = decoy.mock(cls=TempDeck)
    decoy.when(temp_mod.device_info).then_return({"serial": "serial-1"})
    decoy.when(temp_mod.model()).then_return("temperatureModuleV1")

    return temp_mod


@pytest.fixture
async def temp_module_v2(decoy: Decoy) -> TempDeck:
    """Get a mocked out module fixture."""
    temp_mod = decoy.mock(cls=TempDeck)
    decoy.when(temp_mod.device_info).then_return({"serial": "serial-2"})
    decoy.when(temp_mod.model()).then_return("temperatureModuleV2")

    return temp_mod


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    labware_data_provider: LabwareDataProvider,
    module_data_provider: ModuleDataProvider,
    model_utils: ModelUtils,
) -> EquipmentHandler:
    """Get an EquipmentHandler test subject with its dependencies mocked out."""
    return EquipmentHandler(
        hardware_api=hardware_api,
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        labware_data_provider=labware_data_provider,
        module_data_provider=module_data_provider,
        model_utils=model_utils,
    )


async def test_load_labware(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    labware_data_provider: LabwareDataProvider,
    minimal_labware_def: LabwareDefinition,
    subject: EquipmentHandler,
) -> None:
    """It should load labware definition and offset data and generate an ID."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(state_store.labware.get_definition_by_uri(matchers.IsA(str))).then_raise(
        errors.LabwareDefinitionDoesNotExistError("oh no")
    )

    decoy.when(
        await labware_data_provider.get_labware_definition(
            load_name="load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(minimal_labware_def)

    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_3),
        )
    ).then_return(
        LabwareOffset(
            id="labware-offset-id",
            createdAt=datetime(year=2021, month=1, day=2),
            definitionUri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_3),
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
    )

    result = await subject.load_labware(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
        labware_id=None,
    )

    assert result == LoadedLabwareData(
        labware_id="unique-id",
        definition=minimal_labware_def,
        offsetId="labware-offset-id",
    )


async def test_load_labware_off_deck(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    labware_data_provider: LabwareDataProvider,
    minimal_labware_def: LabwareDefinition,
    subject: EquipmentHandler,
) -> None:
    """It should load labware definition and offset data and generate an ID."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(
        state_store.labware.get_definition_by_uri(
            cast("LabwareUri", "opentrons-test/load-name/1")
        )
    ).then_return(minimal_labware_def)

    result = await subject.load_labware(
        location=OFF_DECK_LOCATION,
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
        labware_id=None,
    )

    assert result == LoadedLabwareData(
        labware_id="unique-id",
        definition=minimal_labware_def,
        offsetId=None,
    )


async def test_load_labware_uses_provided_id(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    labware_data_provider: LabwareDataProvider,
    minimal_labware_def: LabwareDefinition,
    subject: EquipmentHandler,
) -> None:
    """It should use the provided ID rather than generating an ID for the labware."""
    decoy.when(state_store.labware.get_definition_by_uri(matchers.IsA(str))).then_raise(
        errors.LabwareDefinitionDoesNotExistError("oh no")
    )

    decoy.when(
        await labware_data_provider.get_labware_definition(
            load_name="load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(minimal_labware_def)

    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_3),
        )
    ).then_return(None)

    result = await subject.load_labware(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
        labware_id="my-labware-id",
    )

    assert result == LoadedLabwareData(
        labware_id="my-labware-id", definition=minimal_labware_def, offsetId=None
    )


async def test_load_labware_uses_loaded_labware_def(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    labware_data_provider: LabwareDataProvider,
    minimal_labware_def: LabwareDefinition,
    subject: EquipmentHandler,
) -> None:
    """Loading labware should use the labware definition already in state."""
    expected_uri = uri_from_details(
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
    )

    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(state_store.labware.get_definition_by_uri(expected_uri)).then_return(
        minimal_labware_def
    )

    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_3),
        )
    ).then_return(None)

    result = await subject.load_labware(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
        labware_id=None,
    )

    assert result == LoadedLabwareData(
        labware_id="unique-id",
        definition=minimal_labware_def,
        offsetId=None,
    )

    decoy.verify(
        await labware_data_provider.get_labware_definition(
            load_name="load-name",
            namespace="opentrons-test",
            version=1,
        ),
        times=0,
    )


async def test_load_labware_on_module(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    labware_data_provider: LabwareDataProvider,
    minimal_labware_def: LabwareDefinition,
    tempdeck_v1_def: ModuleDefinition,
    subject: EquipmentHandler,
) -> None:
    """It should load labware definition and offset data and generate an ID."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(
        state_store.labware.get_definition_by_uri(matchers.IsA(str))
    ).then_return(minimal_labware_def)

    decoy.when(state_store.modules.get_model("module-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V1
    )
    decoy.when(state_store.modules.get_location("module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )

    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V1,
            ),
        )
    ).then_return(
        LabwareOffset(
            id="labware-offset-id",
            createdAt=datetime(year=2021, month=1, day=2),
            definitionUri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V1,
            ),
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
    )

    result = await subject.load_labware(
        location=ModuleLocation(moduleId="module-id"),
        load_name="load-name",
        namespace="opentrons-test",
        version=1,
        labware_id=None,
    )

    assert result == LoadedLabwareData(
        labware_id="unique-id",
        definition=minimal_labware_def,
        offsetId="labware-offset-id",
    )


def test_find_offset_id_of_labware_on_deck_slot(
    decoy: Decoy,
    state_store: StateStore,
    subject: EquipmentHandler,
) -> None:
    """It should find the offset by resolving the provided location."""
    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=None,
            ),
        )
    ).then_return(
        LabwareOffset(
            id="labware-offset-id",
            createdAt=datetime(year=2021, month=1, day=2),
            definitionUri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=None,
            ),
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
    )

    result = subject.find_applicable_labware_offset_id(
        labware_definition_uri="opentrons-test/load-name/1",
        labware_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
    )

    assert result == "labware-offset-id"


def test_find_offset_id_of_labware_on_module(
    decoy: Decoy,
    state_store: StateStore,
    subject: EquipmentHandler,
) -> None:
    """It should find a new offset by resolving the new location."""
    decoy.when(state_store.modules.get_model("input-module-id")).then_return(
        ModuleModel.THERMOCYCLER_MODULE_V1
    )
    decoy.when(state_store.modules.get_location("input-module-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_3)
    )

    decoy.when(
        state_store.labware.find_applicable_labware_offset(
            definition_uri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V1,
            ),
        )
    ).then_return(
        LabwareOffset(
            id="labware-offset-id",
            createdAt=datetime(year=2021, month=1, day=2),
            definitionUri="opentrons-test/load-name/1",
            location=LabwareOffsetLocation(
                slotName=DeckSlotName.SLOT_3,
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V1,
            ),
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
    )

    result = subject.find_applicable_labware_offset_id(
        labware_definition_uri="opentrons-test/load-name/1",
        labware_location=ModuleLocation(moduleId="input-module-id"),
    )

    assert result == "labware-offset-id"


def test_find_offset_id_of_labware_off_deck(
    decoy: Decoy,
    state_store: StateStore,
    subject: EquipmentHandler,
) -> None:
    """It should return None for offset_id of labware off-deck."""
    result = subject.find_applicable_labware_offset_id(
        labware_definition_uri="opentrons-test/load-name/1",
        labware_location=OFF_DECK_LOCATION,
    )
    assert result is None


async def test_load_pipette(
    decoy: Decoy,
    model_utils: ModelUtils,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: EquipmentHandler,
) -> None:
    """It should load pipette data, check attachment, and generate an ID."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")
    decoy.when(state_store.pipettes.get_by_mount(MountType.RIGHT)).then_return(
        LoadedPipette.construct(pipetteName=PipetteNameType.P300_MULTI)  # type: ignore[call-arg]
    )
    decoy.when(hardware_api.get_attached_instrument(mount=HwMount.LEFT)).then_return(
        cast(
            PipetteDict,
            {
                "model": "pipette-model",
                "min_volume": 1.23,
                "max_volume": 4.56,
                "channels": 7,
            },
        )
    )

    result = await subject.load_pipette(
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
        pipette_id=None,
    )

    assert result == LoadedPipetteData(pipette_id="unique-id")

    decoy.verify(
        await hardware_api.cache_instruments(
            {
                HwMount.LEFT: PipetteNameType.P300_SINGLE.value,
                HwMount.RIGHT: PipetteNameType.P300_MULTI.value,
            }
        ),
        action_dispatcher.dispatch(
            AddPipetteConfigAction(
                pipette_id="unique-id",
                model="pipette-model",
                min_volume=1.23,
                max_volume=4.56,
                channels=7,
            )
        ),
    )


async def test_load_pipette_96_channels(
    decoy: Decoy,
    model_utils: ModelUtils,
    hardware_api: HardwareControlAPI,
    action_dispatcher: ActionDispatcher,
    subject: EquipmentHandler,
) -> None:
    """It should load pipette data, check attachment, and generate an ID."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(hardware_api.get_attached_instrument(mount=HwMount.LEFT)).then_return(
        cast(
            PipetteDict,
            {
                "model": "pipette-model",
                "min_volume": 1.23,
                "max_volume": 4.56,
                "channels": 7,
            },
        )
    )

    result = await subject.load_pipette(
        pipette_name="p1000_96",
        mount=MountType.LEFT,
        pipette_id=None,
    )

    assert result == LoadedPipetteData(pipette_id="unique-id")

    decoy.verify(
        await hardware_api.cache_instruments({HwMount.LEFT: "p1000_96"}),
        action_dispatcher.dispatch(
            AddPipetteConfigAction(
                pipette_id="unique-id",
                model="pipette-model",
                min_volume=1.23,
                max_volume=4.56,
                channels=7,
            )
        ),
    )


async def test_load_pipette_uses_provided_id(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    action_dispatcher: ActionDispatcher,
    subject: EquipmentHandler,
) -> None:
    """It should use the provided ID rather than generating an ID for the pipette."""
    decoy.when(hardware_api.get_attached_instrument(mount=HwMount.LEFT)).then_return(
        cast(
            PipetteDict,
            {
                "model": "pipette-model",
                "min_volume": 1.23,
                "max_volume": 4.56,
                "channels": 7,
            },
        )
    )

    result = await subject.load_pipette(
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
        pipette_id="my-pipette-id",
    )

    assert result == LoadedPipetteData(pipette_id="my-pipette-id")

    decoy.verify(
        action_dispatcher.dispatch(
            AddPipetteConfigAction(
                pipette_id="my-pipette-id",
                model="pipette-model",
                min_volume=1.23,
                max_volume=4.56,
                channels=7,
            )
        )
    )


async def test_load_pipette_raises_if_pipette_not_attached(
    decoy: Decoy,
    model_utils: ModelUtils,
    hardware_api: HardwareControlAPI,
    subject: EquipmentHandler,
) -> None:
    """Loading a pipette should raise if unable to cache instruments."""
    decoy.when(model_utils.generate_id()).then_return("unique-id")

    decoy.when(
        await hardware_api.cache_instruments(
            {HwMount.LEFT: PipetteNameType.P300_SINGLE.value}
        )
    ).then_raise(
        RuntimeError(
            "mount LEFT: instrument p300_single was requested, "
            "but no instrument is present"
        )
    )

    with pytest.raises(
        errors.FailedToLoadPipetteError, match=".+p300_single was requested"
    ):
        await subject.load_pipette(
            pipette_name=PipetteNameType.P300_SINGLE,
            mount=MountType.LEFT,
            pipette_id=None,
        )


async def test_load_module(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    module_data_provider: ModuleDataProvider,
    hardware_api: HardwareControlAPI,
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
    temp_module_v1: AbstractModule,
    temp_module_v2: AbstractModule,
    subject: EquipmentHandler,
) -> None:
    """It should load a module, returning its ID, serial & definition in result."""
    decoy.when(model_utils.ensure_id("input-module-id")).then_return("module-id")

    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V1)
    ).then_return(tempdeck_v1_def)

    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V2)
    ).then_return(tempdeck_v2_def)

    decoy.when(hardware_api.attached_modules).then_return(
        [
            temp_module_v1,
            temp_module_v2,
        ]
    )

    decoy.when(state_store.config).then_return(_make_config(use_virtual_modules=False))

    decoy.when(
        state_store.modules.select_hardware_module_to_load(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            attached_modules=[
                HardwareModule(serial_number="serial-1", definition=tempdeck_v1_def),
                HardwareModule(serial_number="serial-2", definition=tempdeck_v2_def),
            ],
        )
    ).then_return(HardwareModule(serial_number="serial-1", definition=tempdeck_v1_def))

    result = await subject.load_module(
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        module_id="input-module-id",
    )

    assert result == LoadedModuleData(
        module_id="module-id",
        serial_number="serial-1",
        definition=tempdeck_v1_def,
    )


async def test_load_module_using_virtual(
    decoy: Decoy,
    model_utils: ModelUtils,
    state_store: StateStore,
    module_data_provider: ModuleDataProvider,
    hardware_api: HardwareControlAPI,
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
    temp_module_v1: AbstractModule,
    temp_module_v2: AbstractModule,
    subject: EquipmentHandler,
) -> None:
    """It should load a virtual module."""
    decoy.when(model_utils.ensure_id("input-module-id")).then_return("module-id")

    decoy.when(model_utils.generate_id(prefix="fake-serial-number-")).then_return(
        "fake-serial-number-abc123"
    )

    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V1)
    ).then_return(tempdeck_v1_def)

    decoy.when(state_store.config).then_return(_make_config(use_virtual_modules=True))

    result = await subject.load_module(
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        module_id="input-module-id",
    )

    assert result == LoadedModuleData(
        module_id="module-id",
        serial_number="fake-serial-number-abc123",
        definition=tempdeck_v1_def,
    )


def test_get_module_hardware_api(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    subject: EquipmentHandler,
) -> None:
    """It should get a module's hardware API."""
    module_1 = decoy.mock(cls=TempDeck)
    module_2 = decoy.mock(cls=MagDeck)
    module_3 = decoy.mock(cls=HeaterShaker)

    decoy.when(state_store.config).then_return(_make_config(use_virtual_modules=False))
    decoy.when(state_store.modules.get_serial_number("module-id")).then_return(
        "serial-2"
    )

    decoy.when(module_1.device_info).then_return({"serial": "serial-1"})
    decoy.when(module_2.device_info).then_return({"serial": "serial-2"})
    decoy.when(module_3.device_info).then_return({"serial": "serial-3"})
    decoy.when(hardware_api.attached_modules).then_return(
        [module_1, module_2, module_3]
    )

    result = subject.get_module_hardware_api(cast(Any, "module-id"))
    assert result is module_2


def test_get_module_hardware_api_virtual(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    subject: EquipmentHandler,
) -> None:
    """It should return None if modules are being virtualized."""
    module_1 = decoy.mock(cls=TempDeck)
    module_2 = decoy.mock(cls=MagDeck)
    module_3 = decoy.mock(cls=HeaterShaker)

    decoy.when(state_store.config).then_return(_make_config(use_virtual_modules=True))
    decoy.when(state_store.modules.get_serial_number("module-id")).then_return(
        "serial-2"
    )

    decoy.when(module_1.device_info).then_return({"serial": "serial-1"})
    decoy.when(module_2.device_info).then_return({"serial": "serial-2"})
    decoy.when(module_3.device_info).then_return({"serial": "serial-3"})
    decoy.when(hardware_api.attached_modules).then_return(
        [module_1, module_2, module_3]
    )

    result = subject.get_module_hardware_api(cast(Any, "module-id"))
    assert result is None


def test_get_module_hardware_api_missing(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    subject: EquipmentHandler,
) -> None:
    """It should raise an error if a module's hardware API is not found."""
    module_1 = decoy.mock(cls=TempDeck)
    module_2 = decoy.mock(cls=MagDeck)
    module_3 = decoy.mock(cls=HeaterShaker)

    decoy.when(state_store.config).then_return(_make_config(use_virtual_modules=False))
    decoy.when(state_store.modules.get_serial_number("module-id")).then_return(
        "the-limit-does-not-exist"
    )

    decoy.when(module_1.device_info).then_return({"serial": "serial-1"})
    decoy.when(module_2.device_info).then_return({"serial": "serial-2"})
    decoy.when(module_3.device_info).then_return({"serial": "serial-3"})
    decoy.when(hardware_api.attached_modules).then_return(
        [module_1, module_2, module_3]
    )

    with pytest.raises(errors.ModuleNotAttachedError):
        subject.get_module_hardware_api(cast(Any, "module-id"))
