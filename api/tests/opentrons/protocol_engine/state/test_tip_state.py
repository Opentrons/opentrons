"""Tests for tip state store and selectors."""
import pytest

from typing import Optional

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters as LabwareParameters,
)
from opentrons_shared_data.pipette import pipette_definition

from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.state.tips import TipStore, TipView
from opentrons.protocol_engine.types import FlowRates, DeckPoint
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

_tip_rack_parameters = LabwareParameters.construct(isTiprack=True)  # type: ignore[call-arg]


@pytest.fixture
def subject() -> TipStore:
    """Get a TipStore test subject."""
    return TipStore()


@pytest.fixture
def labware_definition() -> LabwareDefinition:
    """Get a labware definition value object."""
    return LabwareDefinition.construct(  # type: ignore[call-arg]
        ordering=[
            ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
            ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"],
            ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"],
            ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4"],
            ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5"],
            ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"],
            ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"],
            ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"],
            ["A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9"],
            ["A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10"],
            ["A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11"],
            ["A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"],
        ],
        parameters=_tip_rack_parameters,
    )


@pytest.fixture
def load_labware_command(labware_definition: LabwareDefinition) -> commands.LoadLabware:
    """Get a load labware command value object."""
    return commands.LoadLabware.construct(  # type: ignore[call-arg]
        result=commands.LoadLabwareResult.construct(
            labwareId="cool-labware",
            definition=labware_definition,
        )
    )


@pytest.fixture
def pick_up_tip_command() -> commands.PickUpTip:
    """Get a pick-up tip command value object."""
    return commands.PickUpTip.construct(  # type: ignore[call-arg]
        params=commands.PickUpTipParams.construct(
            pipetteId="pipette-id",
            labwareId="cool-labware",
            wellName="A1",
        ),
        result=commands.PickUpTipResult.construct(
            position=DeckPoint(x=0, y=0, z=0), tipLength=1.23
        ),
    )


@pytest.fixture
def drop_tip_command() -> commands.DropTip:
    """Get a drop tip command value object."""
    return commands.DropTip.construct(  # type: ignore[call-arg]
        params=commands.DropTipParams.construct(
            pipetteId="pipette-id",
            labwareId="cool-labware",
            wellName="A1",
        ),
        result=commands.DropTipResult.construct(position=DeckPoint(x=0, y=0, z=0)),
    )


@pytest.fixture
def drop_tip_in_place_command() -> commands.DropTipInPlace:
    """Get a drop tip in place command object."""
    return commands.DropTipInPlace.construct(  # type: ignore[call-arg]
        params=commands.DropTipInPlaceParams.construct(
            pipetteId="pipette-id",
        ),
        result=commands.DropTipInPlaceResult.construct(),
    )


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(ordering=[], parameters=_tip_rack_parameters)  # type: ignore[call-arg]
    ],
)
def test_get_next_tip_returns_none(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name=None,
    )

    assert result is None


@pytest.mark.parametrize("input_tip_amount", [1, 8, 96])
def test_get_next_tip_returns_first_tip(
    load_labware_command: commands.LoadLabware, subject: TipStore, input_tip_amount: int
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=input_tip_amount,
        starting_tip_name=None,
    )

    assert result == "A1"


@pytest.mark.parametrize("input_tip_amount, result_well_name", [(1, "B1"), (8, "A2")])
def test_get_next_tip_used_starting_tip(
    load_labware_command: commands.LoadLabware,
    subject: TipStore,
    input_tip_amount: int,
    result_well_name: str,
) -> None:
    """It should start searching at the given starting tip."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=input_tip_amount,
        starting_tip_name="B1",
    )

    assert result == result_well_name


@pytest.mark.parametrize(
    "input_tip_amount, get_next_tip_tips, input_starting_tip, result_well_name",
    [
        (1, 8, "A2", "A2"),
        (1, 1, "A2", "A2"),
        (8, 8, "B2", "A3"),
        (1, 8, "A1", "A2"),
        (8, 1, "D1", "A2"),
        (1, 96, "A1", None),
        (1, 8, None, "A2"),
        (8, 1, "D1", "A2"),
        (1, 96, None, None),
    ],
)
def test_get_next_tip_skips_picked_up_tip(
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
    subject: TipStore,
    input_tip_amount: int,
    get_next_tip_tips: int,
    input_starting_tip: Optional[str],
    result_well_name: Optional[str],
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should get the next tip in the column if one has been picked up."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(
        actions.AddPipetteConfigAction(
            pipette_id="pipette-id",
            serial_number="pipette-serial",
            config=LoadedStaticPipetteData(
                channels=input_tip_amount,
                max_volume=15,
                min_volume=3,
                model="gen a",
                display_name="display name",
                flow_rates=FlowRates(
                    default_aspirate={},
                    default_dispense={},
                    default_blow_out={},
                ),
                tip_configuration_lookup_table={15: supported_tip_fixture},
                nominal_tip_overlap={},
                nozzle_offset_z=1.23,
                home_position=4.56,
            ),
        )
    )
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=get_next_tip_tips,
        starting_tip_name=input_starting_tip,
    )

    assert result == result_well_name


def test_get_next_tip_with_column_and_starting_tip(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the first tip in a column, taking starting tip into account."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="D1",
    )

    assert result == "A2"


def test_reset_tips(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should be able to reset tip tracking state."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(
        actions.AddPipetteConfigAction(
            pipette_id="pipette-id",
            serial_number="pipette-serial",
            config=LoadedStaticPipetteData(
                channels=8,
                max_volume=15,
                min_volume=3,
                model="gen a",
                display_name="display name",
                flow_rates=FlowRates(
                    default_aspirate={},
                    default_dispense={},
                    default_blow_out={},
                ),
                tip_configuration_lookup_table={15: supported_tip_fixture},
                nominal_tip_overlap={},
                nozzle_offset_z=1.23,
                home_position=4.56,
            ),
        )
    )
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))
    subject.handle_action(actions.ResetTipsAction(labware_id="cool-labware"))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name=None,
    )

    assert result == "A1"


def test_handle_pipette_config_action(
    subject: TipStore, supported_tip_fixture: pipette_definition.SupportedTipsDefinition
) -> None:
    """Should add pipette channel to state."""
    subject.handle_action(
        actions.AddPipetteConfigAction(
            pipette_id="pipette-id",
            serial_number="pipette-serial",
            config=LoadedStaticPipetteData(
                channels=8,
                max_volume=15,
                min_volume=3,
                model="gen a",
                display_name="display name",
                flow_rates=FlowRates(
                    default_aspirate={},
                    default_dispense={},
                    default_blow_out={},
                ),
                tip_configuration_lookup_table={15: supported_tip_fixture},
                nominal_tip_overlap={},
                nozzle_offset_z=1.23,
                home_position=4.56,
            ),
        )
    )

    assert TipView(subject.state).get_pipette_channels(pipette_id="pipette-id") == 8


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition.construct(  # type: ignore[call-arg]
            ordering=[["A1"]],
            parameters=LabwareParameters.construct(isTiprack=False),  # type: ignore[call-arg]
        )
    ],
)
def test_has_tip_not_tip_rack(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should return False if labware isn't a tip rack."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(state=subject.state).has_clean_tip("cool-labware", "A1")

    assert result is False


def test_has_tip_tip_rack(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should return False if labware isn't a tip rack."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(state=subject.state).has_clean_tip("cool-labware", "A1")

    assert result is True


def test_drop_tip(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
    drop_tip_command: commands.DropTip,
    drop_tip_in_place_command: commands.DropTipInPlace,
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should be clear tip length when a tip is dropped."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(
        actions.AddPipetteConfigAction(
            pipette_id="pipette-id",
            serial_number="pipette-serial",
            config=LoadedStaticPipetteData(
                channels=8,
                max_volume=15,
                min_volume=3,
                model="gen a",
                display_name="display name",
                flow_rates=FlowRates(
                    default_aspirate={},
                    default_dispense={},
                    default_blow_out={},
                ),
                tip_configuration_lookup_table={15: supported_tip_fixture},
                nominal_tip_overlap={},
                nozzle_offset_z=1.23,
                home_position=4.56,
            ),
        )
    )
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 1.23

    subject.handle_action(actions.UpdateCommandAction(command=drop_tip_command))
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 0

    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 1.23

    subject.handle_action(
        actions.UpdateCommandAction(command=drop_tip_in_place_command)
    )
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 0
