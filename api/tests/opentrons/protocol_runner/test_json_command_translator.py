"""Tests for the JSON JsonCommandTranslator interface."""
import pytest
from typing import Dict, List

from opentrons_shared_data.labware.labware_definition import LabwareDefinition, Parameters, Metadata, DisplayCategory, \
    BrandData, CornerOffsetFromSlot, Dimensions, Group, Metadata1, WellDefinition
import opentrons_shared_data.protocol.models as json_v6_models
from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_runner.json_command_translator import JsonCommandTranslator
from opentrons.protocol_engine import (
    commands as pe_commands,
    DeckSlotLocation,
    PipetteName,
    WellLocation,
    WellOrigin,
    WellOffset,
    ModuleModel,
    ModuleLocation
)

INVALID_TEST_PARAMS = [
    (
        json_v6_models.Command(
            commandType="aspirate",
            id="command-id-ddd-666",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                # todo (Max and Tamar 3/17/22):needs to be added to the aspirate command
                # https://github.com/Opentrons/opentrons/issues/8204
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.AspirateCreate(
            params=pe_commands.AspirateParams(
                # todo: id
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="dispense-command-id-666",
            commandType="dispense",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.DispenseCreate(
            params=pe_commands.DispenseParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="dropTip-command-id-666",
            commandType="dropTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.DropTipCreate(
            params=pe_commands.DropTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="pickUpTip-command-id-666",
            commandType="pickUpTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.PickUpTipCreate(
            params=pe_commands.PickUpTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="load-pipette-command-id-666",
            commandType="loadPipette",  # used to be delay but is expecting pause
            params=json_v6_models.Params(pipetteId="pipetteId", mount="left"),
        ),
        pe_commands.LoadPipetteCreate(
            params=pe_commands.LoadPipetteParams(
                pipetteId="pipetteId",
                pipetteName=PipetteName("p10_single"),
                mount=MountType("right"),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="load-module-command-id-666",
            commandType="loadModule",  # used to be delay but is expecting pause
            params=json_v6_models.Params(
                moduleId="magneticModuleId",
                location=json_v6_models.Location(slotName="3"),
            ),
        ),
        pe_commands.LoadModuleCreate(
            params=pe_commands.LoadModuleParams(
                model=ModuleModel("magneticModuleV2"),
                moduleId="magneticModuleId",
                location=DeckSlotLocation(slotName=(DeckSlotName("4"))),
            )
        ),
    ),
]

VALID_TEST_PARAMS = [
    (
        json_v6_models.Command(
            commandType="aspirate",
            id="command-id-ddd-666",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                # todo (Max and Tamar 3/17/22):needs to be added to the aspirate command
                #  https://github.com/Opentrons/opentrons/issues/8204
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.AspirateCreate(
            params=pe_commands.AspirateParams(
                # todo: id
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89),
                ),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="dispense-command-id-666",
            commandType="dispense",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(
                    origin="bottom",
                    offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89),
                ),
            ),
        ),
        pe_commands.DispenseCreate(
            params=pe_commands.DispenseParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89),
                ),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="dropTip-command-id-666",
            commandType="dropTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
            ),
        ),
        pe_commands.DropTipCreate(
            params=pe_commands.DropTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="pickUpTip-command-id-666",
            commandType="pickUpTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
            ),
        ),
        pe_commands.PickUpTipCreate(
            params=pe_commands.PickUpTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="delay-command-id-666",
            commandType="pause",  # used to be delay but is expecting pause
            params=json_v6_models.Params(
                wait=True,
                message="hello world",
            ),
        ),
        pe_commands.PauseCreate(params=pe_commands.PauseParams(message="hello world")),
    ),
    (
        json_v6_models.Command(
            id="load-pipette-command-id-666",
            commandType="loadPipette",  # used to be delay but is expecting pause
            params=json_v6_models.Params(pipetteId="pipetteId", mount="left"),
        ),
        pe_commands.LoadPipetteCreate(
            params=pe_commands.LoadPipetteParams(
                pipetteId="pipetteId",
                pipetteName=PipetteName("p10_single"),
                mount=MountType("left"),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="load-module-command-id-666",
            commandType="loadModule",  # used to be delay but is expecting pause
            params=json_v6_models.Params(
                moduleId="magneticModuleId",
                location=json_v6_models.Location(slotName="3"),
            ),
        ),
        pe_commands.LoadModuleCreate(
            params=pe_commands.LoadModuleParams(
                model=ModuleModel("magneticModuleV2"),
                moduleId="magneticModuleId",
                location=DeckSlotLocation(slotName=(DeckSlotName("3"))),
            )
        ),
    ),
    (
        json_v6_models.Command(
            id="load-labware-command-id-666",
            commandType="loadLabware",  # used to be delay but is expecting pause
            params=json_v6_models.Params(
                labwareId="sourcePlateId",
                location=json_v6_models.Location(moduleId="temperatureModuleId"),
            ),
        ),
        pe_commands.LoadLabwareCreate(
            params=pe_commands.LoadLabwareParams(
                loadName="foo_8_plate_33ul",
                displayName="Source Plate",
                labwareId="sourcePlateId",
                location=ModuleLocation(moduleId="temperatureModuleId"),
                version=1,
                namespace="example"
            )
        ),
    ),
]


@pytest.fixture
def subject() -> JsonCommandTranslator:
    """Get a JsonCommandTranslator test subject."""
    return JsonCommandTranslator()


def _load_labware_definition_data() -> json_v6_models.LabwareDefinition:
    return json_v6_models.LabwareDefinition(version=1, namespace="example",
                                            schemaVersion=2,
                                            ordering=[
                                                ["A1", "B1", "C1", "D1"],
                                                ["A2", "B2", "C2", "D2"]
                                            ],
                                            groups=[Group(wells=["A1"], metadata=Metadata1())],
                                            wells={'A1': WellDefinition(depth=25, x=18.21, y=75.43, z=75,
                                                                        totalLiquidVolume=1100000,
                                                                        shape="rectangular")},
                                            dimensions=Dimensions(yDimension=85.5, zDimension=100, xDimension=127.75,
                                                                  depth=25, totalLiquidVolume=33, shape="circular"),
                                            cornerOffsetFromSlot=CornerOffsetFromSlot(x=0, y=0, z=0),
                                            brand=BrandData(brand="foo"),
                                            metadata=Metadata(displayName="Foo 8 Well Plate 33uL",
                                                              displayCategory=DisplayCategory("wellPlate"),
                                                              displayVolumeUnits="µL"),
                                            parameters=Parameters(
                                                loadName="foo_8_plate_33ul", isTiprack=False,
                                                isMagneticModuleCompatible=False, format="irregular"))


def _make_json_protocol(
        *,
        pipettes: Dict[str, json_v6_models.Pipette] = {
            "pipetteId": json_v6_models.Pipette(name="p10_single")
        },
        labware_definitions: Dict[str, LabwareDefinition] = {
            "example/plate/1": _load_labware_definition_data()},
        labware: Dict[str, json_v6_models.Labware] = {
            "sourcePlateId": json_v6_models.Labware(displayName="Source Plate", definitionId="example/plate/1")},
        commands: List[json_v6_models.Command] = [],
        modules: Dict[str, json_v6_models.Module] = {
            "magneticModuleId": json_v6_models.Module(model="magneticModuleV2")
        }
) -> json_v6_models.ProtocolSchemaV6:
    """Return a minimal JsonProtocol with the given elements, to use as test input."""
    return json_v6_models.ProtocolSchemaV6(
        # schemaVersion is arbitrary. Currently (2021-06-28), JsonProtocol.parse_obj()
        # isn't smart enough to validate differently depending on this field.
        otSharedSchema="#/protocol/schemas/6",
        schemaVersion=6,
        metadata=json_v6_models.Metadata(),
        robot=json_v6_models.Robot(model="OT-2 Standard", deckId="ot2_standard"),
        pipettes=pipettes,
        labwareDefinitions=labware_definitions,
        labware=labware,
        commands=commands,
        modules=modules,
    )


@pytest.mark.parametrize("test_input, expected_output", VALID_TEST_PARAMS)
def test_load_command(
        subject: JsonCommandTranslator,
        test_input: json_v6_models.Command,
        expected_output: pe_commands.CommandCreate,
) -> None:
    """Test translating v6 commands to protocol engine commands."""
    output = subject.translate(_make_json_protocol(commands=[test_input]))
    assert output == [expected_output]


@pytest.mark.parametrize("test_input, expected_output", INVALID_TEST_PARAMS)
def test_invalid_commands(
        subject: JsonCommandTranslator,
        test_input: json_v6_models.Command,
        expected_output: pe_commands.CommandCreate,
) -> None:
    """Test fail invalid payload-translating v6 commands to protocol engine commands."""
    with pytest.raises(AssertionError):
        assert subject.translate(_make_json_protocol(commands=[test_input])) == [
            expected_output
        ]
