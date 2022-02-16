"""Tests for ProtocolContext in Python Protocol API v3."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.labware import dev_types as labware_dict_types

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands as pe_commands
from opentrons.protocol_engine.types import ModuleDefinition
from opentrons.protocol_engine.clients import SyncClient

from opentrons.protocol_api_experimental.types import (
    DeckSlotLocation,
    DeckSlotName,
    DeprecatedMount,
    ModuleModel,
    Mount,
    PipetteName,
)

from opentrons.protocol_api_experimental import (
    ProtocolContext,
    PipetteContext,
    Labware,
    module_contexts,
    errors,
)


@pytest.fixture(scope="session")
def magdeck_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 magdeck."""
    definition = load_shared_data("module/definitions/2/magneticModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def magdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V1 magdeck."""
    definition = load_shared_data("module/definitions/2/magneticModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def tempdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V1 tempdeck."""
    definition = load_shared_data("module/definitions/2/temperatureModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def tempdeck_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 tempdeck."""
    definition = load_shared_data("module/definitions/2/temperatureModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def thermocycler_v1_def() -> ModuleDefinition:
    """Get the definition of a V2 thermocycler."""
    definition = load_shared_data("module/definitions/2/thermocyclerModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture
def engine_client(decoy: Decoy) -> SyncClient:
    """Get a fake ProtocolEngine client."""
    return decoy.mock(cls=SyncClient)


@pytest.fixture
def subject(engine_client: SyncClient) -> ProtocolContext:
    """Get a ProtocolContext with its dependencies mocked out."""
    return ProtocolContext(engine_client=engine_client)


def test_load_pipette(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a pipette into the protocol."""
    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=Mount.LEFT,
        )
    ).then_return(pe_commands.LoadPipetteResult(pipetteId="pipette-id"))

    result = subject.load_pipette(pipette_name="p300_single", mount="left")

    assert result == PipetteContext(
        engine_client=engine_client,
        pipette_id="pipette-id",
    )


def test_load_instrument(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a pipette with legacy load_instrument method."""
    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_MULTI,
            mount=Mount.LEFT,
        )
    ).then_return(pe_commands.LoadPipetteResult(pipetteId="left-pipette-id"))

    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=Mount.RIGHT,
        )
    ).then_return(pe_commands.LoadPipetteResult(pipetteId="right-pipette-id"))

    left_result = subject.load_instrument(instrument_name="p300_multi", mount="left")

    right_result = subject.load_instrument(
        instrument_name="p300_single",
        mount=DeprecatedMount.RIGHT,
    )

    assert left_result == PipetteContext(
        engine_client=engine_client,
        pipette_id="left-pipette-id",
    )

    assert right_result == PipetteContext(
        engine_client=engine_client,
        pipette_id="right-pipette-id",
    )


def test_load_pipette_with_bad_args(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should raise if an invalid pipette name or mount is used."""
    with pytest.raises(errors.InvalidPipetteNameError, match="electronic-thumb"):
        subject.load_pipette(pipette_name="electronic-thumb", mount="left")

    with pytest.raises(errors.InvalidMountError, match="west"):
        subject.load_pipette(pipette_name="p300_single", mount="west")


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_pipette_with_tipracks_list(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `tip_racks` parameter to load_pipette."""
    subject.load_pipette(
        pipette_name="p300_single",
        mount="left",
        tip_racks=("something"),  # type: ignore[arg-type]
    )


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_pipette_with_replace(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `replace` parameter to load_pipette."""
    subject.load_pipette(pipette_name="p300_single", mount="left", replace=True)


def test_load_labware_explicit_namespace_and_version(
    decoy: Decoy,
    minimal_labware_def: labware_dict_types.LabwareDefinition,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should use the engine to load a labware in a slot."""
    decoy.when(
        engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            namespace="some_explicit_namespace",
            version=9001,
        )
    ).then_return(
        pe_commands.LoadLabwareResult(
            labwareId="abc123",
            definition=LabwareDefinition.parse_obj(minimal_labware_def),
            offsetId=None,
        )
    )

    result = subject.load_labware(
        load_name="some_labware",
        location=5,
        namespace="some_explicit_namespace",
        version=9001,
    )

    assert result == Labware(labware_id="abc123", engine_client=engine_client)


def test_load_labware_default_namespace_and_version(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should default namespace to "opentrons" and version to 1."""
    decoy.when(
        engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        pe_commands.LoadLabwareResult(
            labwareId="abc123",
            definition=minimal_labware_def,
            offsetId=None,
        )
    )

    result = subject.load_labware(load_name="some_labware", location=5)

    assert result == Labware(labware_id="abc123", engine_client=engine_client)


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_labware_with_label(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `label` parameter to load_labware."""
    subject.load_labware(load_name="some_labware", location=5, label="some_label")


def test_pause(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to issue a Pause command through the client."""
    subject.pause()
    decoy.verify(engine_client.pause(message=None), times=1)

    subject.pause(msg="hello world")
    decoy.verify(engine_client.pause(message="hello world"), times=1)


@pytest.mark.parametrize(
    argnames=[
        "module_name",
        "definition",
        "expected_model",
    ],
    argvalues=[
        (
            "magneticModuleV1",
            lazy_fixture("magdeck_v1_def"),
            ModuleModel.MAGNETIC_MODULE_V1,
        ),
        (
            "magdeck",
            lazy_fixture("magdeck_v1_def"),
            ModuleModel.MAGNETIC_MODULE_V1,
        ),
        (
            "magnetic module",
            lazy_fixture("magdeck_v1_def"),
            ModuleModel.MAGNETIC_MODULE_V1,
        ),
        (
            "magneticModuleV2",
            lazy_fixture("magdeck_v2_def"),
            ModuleModel.MAGNETIC_MODULE_V2,
        ),
        (
            "magnetic module gen2",
            lazy_fixture("magdeck_v2_def"),
            ModuleModel.MAGNETIC_MODULE_V2,
        ),
    ],
)
def test_load_magnetic_module(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
    module_name: str,
    definition: ModuleDefinition,
    expected_model: ModuleModel,
) -> None:
    """It should send load magnetic module requests to the engine."""
    decoy.when(
        engine_client.load_module(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            model=expected_model,
        )
    ).then_return(
        pe_commands.LoadModuleResult(
            moduleId="abc123",
            definition=definition,
            model=definition.model,
            serialNumber="xyz789",
        )
    )

    result = subject.load_module(module_name=module_name, location="3")
    assert result == module_contexts.MagneticModuleContext(
        engine_client=engine_client,
        module_id="abc123",
    )


@pytest.mark.parametrize(
    argnames=[
        "module_name",
        "definition",
        "expected_model",
    ],
    argvalues=[
        (
            "temperatureModuleV1",
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
        ),
        (
            "tempdeck",
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
        ),
        (
            "temperature module",
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
        ),
        (
            "temperatureModuleV2",
            lazy_fixture("tempdeck_v2_def"),
            ModuleModel.TEMPERATURE_MODULE_V2,
        ),
        (
            "temperature module gen2",
            lazy_fixture("tempdeck_v2_def"),
            ModuleModel.TEMPERATURE_MODULE_V2,
        ),
    ],
)
def test_load_temperature_module(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
    module_name: str,
    definition: ModuleDefinition,
    expected_model: ModuleModel,
) -> None:
    """It should send load temperature module requests to the engine."""
    decoy.when(
        engine_client.load_module(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            model=expected_model,
        )
    ).then_return(
        pe_commands.LoadModuleResult(
            moduleId="abc123",
            definition=definition,
            model=definition.model,
            serialNumber="xyz789",
        )
    )

    result = subject.load_module(module_name=module_name, location="3")
    assert result == module_contexts.TemperatureModuleContext(module_id="abc123")


@pytest.mark.parametrize(
    "module_name",
    ["thermocyclerModuleV1", "thermocycler", "thermocycler module"],
)
def test_load_thermocycler(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
    module_name: str,
    thermocycler_v1_def: ModuleDefinition,
) -> None:
    """It should load a thermocycler."""
    decoy.when(
        engine_client.load_module(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_7),
            model=ModuleModel.THERMOCYCLER_MODULE_V1,
        )
    ).then_return(
        pe_commands.LoadModuleResult(
            moduleId="abc123",
            definition=thermocycler_v1_def,
            model=thermocycler_v1_def.model,
            serialNumber="xyz789",
        )
    )

    result = subject.load_module(module_name=module_name)
    assert result == module_contexts.ThermocyclerModuleContext(module_id="abc123")

    result = subject.load_module(module_name=module_name, location="7")
    assert result == module_contexts.ThermocyclerModuleContext(module_id="abc123")


@pytest.mark.parametrize(
    argnames="module_name",
    argvalues=[
        "magneticModuleV1",
        "magneticModuleV2",
        "temperatureModuleV1",
        "temperatureModuleV2",
    ],
)
def test_invalid_load_module_location(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
    module_name: str,
) -> None:
    """It should require locations for non-thermocycler modules."""
    with pytest.raises(errors.InvalidModuleLocationError):
        subject.load_module(module_name=module_name, location=None)
