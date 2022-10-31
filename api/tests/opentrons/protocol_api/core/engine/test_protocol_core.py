"""Test for the ProtocolEngine-based protocol API core."""
from typing import Type

import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LabwareDefDict,
    LabwareUri,
)
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.types import Mount, MountType, DeckSlotName
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    TemperatureModuleModel,
    MagneticModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
)
from opentrons.protocol_engine import (
    ModuleModel as EngineModuleModel,
    DeckSlotLocation,
    ModuleLocation,
    ModuleDefinition,
    LabwareMovementStrategy,
    commands,
)
from opentrons.protocol_engine.clients import SyncClient as EngineClient

from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.engine import (
    ProtocolCore,
    InstrumentCore,
    LabwareCore,
    ModuleCore,
)
from opentrons.protocol_api.core.engine.exceptions import InvalidModuleLocationError
from opentrons.protocol_api.core.engine.module_core import (
    TemperatureModuleCore,
    MagneticModuleCore,
    ThermocyclerModuleCore,
    HeaterShakerModuleCore,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[AbstractModule]:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SynchronousAdapter[AbstractModule]")  # type: ignore[no-any-return]


@pytest.fixture
def mock_sync_hardware_api(decoy: Decoy) -> SyncHardwareAPI:
    """Get a mock hardware API."""
    return decoy.mock(cls=SyncHardwareAPI)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    api_version: APIVersion,
    mock_sync_hardware_api: SyncHardwareAPI,
) -> ProtocolCore:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    decoy.when(mock_engine_client.state.labware.get_fixed_trash_id()).then_return(
        "fixed-trash-123"
    )
    decoy.when(
        mock_engine_client.state.labware.get_definition("fixed-trash-123")
    ).then_return(
        LabwareDefinition.construct(ordering=[["A1"]])  # type: ignore[call-arg]
    )

    return ProtocolCore(
        engine_client=mock_engine_client,
        api_version=api_version,
        sync_hardware=mock_sync_hardware_api,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_api_version(
    decoy: Decoy, subject: ProtocolCore, api_version: APIVersion
) -> None:
    """Should return the protocol version."""
    assert subject.api_version == api_version


def test_get_fixed_trash(subject: ProtocolCore) -> None:
    """It should have a single labware core for the fixed trash."""
    result = subject.get_fixed_trash()

    assert isinstance(result, LabwareCore)
    assert result.labware_id == "fixed-trash-123"

    # verify it's the same core every time
    assert subject.get_fixed_trash() is result


def test_load_instrument(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ProtocolCore,
) -> None:
    """It should issue a LoadPipette command."""
    decoy.when(
        mock_engine_client.load_pipette(
            pipette_name=PipetteNameType.P300_SINGLE, mount=MountType.LEFT
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="cool-pipette"))

    result = subject.load_instrument(
        instrument_name=PipetteNameType.P300_SINGLE, mount=Mount.LEFT
    )

    assert isinstance(result, InstrumentCore)
    assert result.pipette_id == "cool-pipette"


def test_load_labware(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ProtocolCore,
) -> None:
    """It should issue a LoadLabware command."""
    decoy.when(
        mock_engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            display_name="some_display_name",
            namespace="some_explicit_namespace",
            version=9001,
        )
    ).then_return(
        commands.LoadLabwareResult(
            labwareId="abc123",
            definition=LabwareDefinition.construct(),  # type: ignore[call-arg]
            offsetId=None,
        )
    )

    decoy.when(mock_engine_client.state.labware.get_definition("abc123")).then_return(
        LabwareDefinition.construct(ordering=[])  # type: ignore[call-arg]
    )

    result = subject.load_labware(
        load_name="some_labware",
        location=DeckSlotName.SLOT_5,
        label="some_display_name",  # maps to optional display name
        namespace="some_explicit_namespace",
        version=9001,
    )

    assert isinstance(result, LabwareCore)
    assert result.labware_id == "abc123"


@pytest.mark.parametrize(
    argnames=["use_gripper", "expected_strategy"],
    argvalues=[
        (True, LabwareMovementStrategy.USING_GRIPPER),
        (False, LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE),
    ],
)
def test_move_labware(
    decoy: Decoy,
    subject: ProtocolCore,
    mock_engine_client: EngineClient,
    api_version: APIVersion,
    expected_strategy: LabwareMovementStrategy,
    use_gripper: bool,
) -> None:
    """It should issue a move labware command to the engine."""
    decoy.when(
        mock_engine_client.state.labware.get_definition("labware-id")
    ).then_return(
        LabwareDefinition.construct(ordering=[])  # type: ignore[call-arg]
    )
    labware = LabwareCore(labware_id="labware-id", engine_client=mock_engine_client)
    subject.move_labware(
        labware_core=labware, new_location=DeckSlotName.SLOT_5, use_gripper=use_gripper
    )
    decoy.verify(
        mock_engine_client.move_labware(
            labware_id="labware-id",
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            strategy=expected_strategy,
        )
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_load_labware_on_module(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SynchronousAdapter[AbstractModule],
    subject: ProtocolCore,
    api_version: APIVersion,
) -> None:
    """It should issue a LoadLabware command."""
    decoy.when(
        mock_engine_client.load_labware(
            location=ModuleLocation(moduleId="module-id"),
            load_name="some_labware",
            display_name="some_display_name",
            namespace="some_explicit_namespace",
            version=9001,
        )
    ).then_return(
        commands.LoadLabwareResult(
            labwareId="abc123",
            definition=LabwareDefinition.construct(),  # type: ignore[call-arg]
            offsetId=None,
        )
    )

    decoy.when(mock_engine_client.state.labware.get_definition("abc123")).then_return(
        LabwareDefinition.construct(ordering=[])  # type: ignore[call-arg]
    )

    result = subject.load_labware(
        load_name="some_labware",
        location=ModuleCore(
            module_id="module-id",
            engine_client=mock_engine_client,
            api_version=api_version,
            sync_module_hardware=mock_sync_module_hardware,
        ),
        label="some_display_name",  # maps to optional display name
        namespace="some_explicit_namespace",
        version=9001,
    )

    assert isinstance(result, LabwareCore)
    assert result.labware_id == "abc123"


def test_add_labware_definition(
    decoy: Decoy,
    minimal_labware_def: LabwareDefDict,
    mock_engine_client: EngineClient,
    subject: ProtocolCore,
) -> None:
    """It should add a laware definition to the engine."""
    decoy.when(
        mock_engine_client.add_labware_definition(
            definition=LabwareDefinition.parse_obj(minimal_labware_def)
        )
    ).then_return(LabwareUri("hello/world/123"))

    result = subject.add_labware_definition(minimal_labware_def)

    assert result == LabwareLoadParams("hello", "world", 123)


# TODO(mc, 2022-10-25): move to module core factory function
@pytest.mark.parametrize(
    ("requested_model", "engine_model", "expected_core_cls"),
    [
        (
            TemperatureModuleModel.TEMPERATURE_V1,
            EngineModuleModel.TEMPERATURE_MODULE_V1,
            TemperatureModuleCore,
        ),
        (
            TemperatureModuleModel.TEMPERATURE_V2,
            EngineModuleModel.TEMPERATURE_MODULE_V2,
            TemperatureModuleCore,
        ),
        (
            MagneticModuleModel.MAGNETIC_V1,
            EngineModuleModel.MAGNETIC_MODULE_V1,
            MagneticModuleCore,
        ),
        (
            MagneticModuleModel.MAGNETIC_V2,
            EngineModuleModel.MAGNETIC_MODULE_V2,
            MagneticModuleCore,
        ),
        (
            ThermocyclerModuleModel.THERMOCYCLER_V1,
            EngineModuleModel.THERMOCYCLER_MODULE_V1,
            ThermocyclerModuleCore,
        ),
        (
            ThermocyclerModuleModel.THERMOCYCLER_V2,
            EngineModuleModel.THERMOCYCLER_MODULE_V2,
            ThermocyclerModuleCore,
        ),
        (
            HeaterShakerModuleModel.HEATER_SHAKER_V1,
            EngineModuleModel.HEATER_SHAKER_MODULE_V1,
            HeaterShakerModuleCore,
        ),
    ],
)
def test_load_module(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_hardware_api: SyncHardwareAPI,
    requested_model: ModuleModel,
    engine_model: EngineModuleModel,
    expected_core_cls: Type[ModuleCore],
    subject: ProtocolCore,
) -> None:
    """It should issue a load module engine command."""
    definition = ModuleDefinition.construct()  # type: ignore[call-arg]

    mock_hw_mod_1 = decoy.mock(cls=AbstractModule)
    mock_hw_mod_2 = decoy.mock(cls=AbstractModule)

    decoy.when(mock_hw_mod_1.device_info).then_return({"serial": "abc123"})
    decoy.when(mock_hw_mod_2.device_info).then_return({"serial": "xyz789"})
    decoy.when(mock_sync_hardware_api.attached_modules).then_return(
        [mock_hw_mod_1, mock_hw_mod_2]
    )

    decoy.when(
        mock_engine_client.load_module(
            model=engine_model,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        )
    ).then_return(
        commands.LoadModuleResult(
            moduleId="abc123",
            definition=definition,
            model=engine_model,
            serialNumber="xyz789",
        )
    )

    result = subject.load_module(
        model=requested_model,
        deck_slot=DeckSlotName.SLOT_1,
        configuration="",
    )

    assert isinstance(result, expected_core_cls)
    assert result.module_id == "abc123"


@pytest.mark.parametrize(
    ("requested_model", "engine_model"),
    [
        (
            ThermocyclerModuleModel.THERMOCYCLER_V1,
            EngineModuleModel.THERMOCYCLER_MODULE_V1,
        ),
        (
            ThermocyclerModuleModel.THERMOCYCLER_V2,
            EngineModuleModel.THERMOCYCLER_MODULE_V2,
        ),
    ],
)
def test_load_module_thermocycler_with_no_location(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_hardware_api: SyncHardwareAPI,
    requested_model: ModuleModel,
    engine_model: EngineModuleModel,
    subject: ProtocolCore,
) -> None:
    """It should issue a load module engine command with location at 7."""
    definition = ModuleDefinition.construct()  # type: ignore[call-arg]

    mock_hw_mod = decoy.mock(cls=AbstractModule)
    decoy.when(mock_hw_mod.device_info).then_return({"serial": "xyz789"})
    decoy.when(mock_sync_hardware_api.attached_modules).then_return([mock_hw_mod])

    decoy.when(
        mock_engine_client.load_module(
            model=engine_model,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_7),
        )
    ).then_return(
        commands.LoadModuleResult(
            moduleId="abc123",
            definition=definition,
            model=engine_model,
            serialNumber="xyz789",
        )
    )

    result = subject.load_module(
        model=requested_model,
        deck_slot=None,
        configuration="",
    )

    assert isinstance(result, ThermocyclerModuleCore)
    assert result.module_id == "abc123"


@pytest.mark.parametrize(
    "requested_model",
    [
        HeaterShakerModuleModel.HEATER_SHAKER_V1,
        MagneticModuleModel.MAGNETIC_V1,
        MagneticModuleModel.MAGNETIC_V2,
        TemperatureModuleModel.TEMPERATURE_V1,
        TemperatureModuleModel.TEMPERATURE_V2,
    ],
)
def test_load_module_no_location(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    requested_model: ModuleModel,
    subject: ProtocolCore,
) -> None:
    """Should raise an InvalidModuleLocationError exception."""
    with pytest.raises(InvalidModuleLocationError):
        subject.load_module(model=requested_model, deck_slot=None, configuration="")
