"""Test for the ProtocolEngine-based protocol API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LabwareDefDict,
    LabwareUri,
)
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data import load_shared_data

from opentrons.types import Mount, MountType, DeckSlotName
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import DeckSlotLocation, ModuleLocation, ModuleDefinition

from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.engine import ProtocolCore, InstrumentCore, LabwareCore, ModuleCore

from opentrons.hardware_control.modules.types import TemperatureModuleModel


@pytest.fixture(scope="session")
def tempdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V2 tempdeck."""
    definition = load_shared_data("module/definitions/3/temperatureModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def subject(mock_engine_client: EngineClient) -> ProtocolCore:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    return ProtocolCore(engine_client=mock_engine_client)


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

    result = subject.load_labware(
        load_name="some_labware",
        location=DeckSlotName.SLOT_5,
        label="some_display_name",  # maps to optional display name
        namespace="some_explicit_namespace",
        version=9001,
    )

    assert isinstance(result, LabwareCore)
    assert result.labware_id == "abc123"


def test_load_labware_on_module(
        decoy: Decoy,
        mock_engine_client: EngineClient,
        subject: ProtocolCore,
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

    result = subject.load_labware(
        load_name="some_labware",
        location=ModuleCore(module_id="module-id"),
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


def test_load_module(
        decoy: Decoy,
        mock_engine_client: EngineClient,
        subject: ProtocolCore,
        tempdeck_v2_def: ModuleDefinition
) -> None:
    """It should issue a load module engine command."""
    model = TemperatureModuleModel.TEMPERATURE_V2

    decoy.when(mock_engine_client.load_module(model=model, location=DeckSlotLocation(DeckSlotName.SLOT_1))).then_return(
        commands.LoadModuleResult(
            moduleId="abc123",
            definition=tempdeck_v2_def,
            model=tempdeck_v2_def.model,
            serialNumber="xyz789",
        ))

    result = subject.load_module(model=model, location=DeckSlotName.SLOT_1, configuration="")

