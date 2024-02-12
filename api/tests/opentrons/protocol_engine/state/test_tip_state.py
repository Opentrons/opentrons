"""Tests for tip state store and selectors."""
from collections import OrderedDict

import pytest

from typing import Optional

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters as LabwareParameters,
)
from opentrons_shared_data.pipette import pipette_definition

from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.state.tips import TipStore, TipView
from opentrons.protocol_engine.types import FlowRates, DeckPoint
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)
from opentrons.types import Point

from ..pipette_fixtures import (
    NINETY_SIX_MAP,
    NINETY_SIX_COLS,
    NINETY_SIX_ROWS,
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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )
    subject.handle_action(
        actions.UpdateCommandAction(command=pick_up_tip_command, private_result=None)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=get_next_tip_tips,
        starting_tip_name=input_starting_tip,
    )

    assert result == result_well_name


def test_get_next_tip_with_starting_tip(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the starting tip, and then the following tip after that."""
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="B2",
    )

    assert result == "B2"

    pick_up_tip = commands.PickUpTip.construct(  # type: ignore[call-arg]
        params=commands.PickUpTipParams.construct(
            pipetteId="pipette-id",
            labwareId="cool-labware",
            wellName="B2",
        ),
        result=commands.PickUpTipResult.construct(
            position=DeckPoint(x=0, y=0, z=0), tipLength=1.23
        ),
    )

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="B2",
    )

    assert result == "C2"


def test_get_next_tip_with_starting_tip_8_channel(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the starting tip, and then the following tip after that."""
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="A2",
    )

    assert result == "A2"

    pick_up_tip = commands.PickUpTip.construct(  # type: ignore[call-arg]
        params=commands.PickUpTipParams.construct(
            pipetteId="pipette-id",
            labwareId="cool-labware",
            wellName="A2",
        ),
        result=commands.PickUpTipResult.construct(
            position=DeckPoint(x=0, y=0, z=0), tipLength=1.23
        ),
    )

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="A2",
    )

    assert result == "A3"


def test_get_next_tip_with_starting_tip_out_of_tips(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the starting tip of H12 and then None after that."""
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="H12",
    )

    assert result == "H12"

    pick_up_tip = commands.PickUpTip.construct(  # type: ignore[call-arg]
        params=commands.PickUpTipParams.construct(
            pipetteId="pipette-id",
            labwareId="cool-labware",
            wellName="H12",
        ),
        result=commands.PickUpTipResult.construct(
            position=DeckPoint(x=0, y=0, z=0), tipLength=1.23
        ),
    )

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="H12",
    )

    assert result is None


def test_get_next_tip_with_column_and_starting_tip(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the first tip in a column, taking starting tip into account."""
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )

    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip_command)
    )
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
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )

    assert TipView(subject.state).get_pipette_channels("pipette-id") == 8
    assert TipView(subject.state).get_pipette_active_channels("pipette-id") == 8


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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

    result = TipView(state=subject.state).has_clean_tip("cool-labware", "A1")

    assert result is False


def test_has_tip_tip_rack(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should return False if labware isn't a tip rack."""
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

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
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip_command)
    )
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 1.23

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=drop_tip_command)
    )
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 0

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=pick_up_tip_command)
    )
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 1.23

    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=None, command=drop_tip_in_place_command
        )
    )
    result = TipView(subject.state).get_tip_length("pipette-id")
    assert result == 0


@pytest.mark.parametrize(
    argnames=["nozzle_map", "expected_channels"],
    argvalues=[
        (
            NozzleMap.build(
                physical_nozzles=OrderedDict({"A1": Point(0, 0, 0)}),
                physical_rows=OrderedDict({"A": ["A1"]}),
                physical_columns=OrderedDict({"1": ["A1"]}),
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="A1",
            ),
            1,
        ),
        (
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="H12",
            ),
            96,
        ),
        (
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="E1",
            ),
            5,
        ),
        (None, 9),
    ],
)
def test_active_channels(
    subject: TipStore,
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
    nozzle_map: NozzleMap,
    expected_channels: int,
) -> None:
    """Should update active channels after pipette configuration change."""
    # Load pipette to update state
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
        pipette_id="pipette-id",
        serial_number="pipette-serial",
        config=LoadedStaticPipetteData(
            channels=9,
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )

    # Configure nozzle for partial configuration
    configure_nozzle_layout_cmd = commands.ConfigureNozzleLayout.construct(  # type: ignore[call-arg]
        result=commands.ConfigureNozzleLayoutResult()
    )
    configure_nozzle_private_result = commands.ConfigureNozzleLayoutPrivateResult(
        pipette_id="pipette-id",
        nozzle_map=nozzle_map,
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=configure_nozzle_private_result,
            command=configure_nozzle_layout_cmd,
        )
    )
    assert (
        TipView(subject.state).get_pipette_active_channels("pipette-id")
        == expected_channels
    )


def test_next_tip_uses_active_channels(
    subject: TipStore,
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
) -> None:
    """Test that tip tracking logic uses pipette's active channels."""
    # Load labware
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_labware_command)
    )

    # Load pipette
    load_pipette_command = commands.LoadPipette.construct(  # type: ignore[call-arg]
        result=commands.LoadPipetteResult(pipetteId="pipette-id")
    )
    load_pipette_private_result = commands.LoadPipettePrivateResult(
        pipette_id="pipette-id",
        serial_number="pipette-serial",
        config=LoadedStaticPipetteData(
            channels=96,
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
            back_left_nozzle_offset=Point(x=1, y=2, z=3),
            front_right_nozzle_offset=Point(x=4, y=5, z=6),
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=load_pipette_private_result, command=load_pipette_command
        )
    )

    # Configure nozzle for partial configuration
    configure_nozzle_layout_cmd = commands.ConfigureNozzleLayout.construct(  # type: ignore[call-arg]
        result=commands.ConfigureNozzleLayoutResult()
    )
    configure_nozzle_private_result = commands.ConfigureNozzleLayoutPrivateResult(
        pipette_id="pipette-id",
        nozzle_map=NozzleMap.build(
            physical_nozzles=NINETY_SIX_MAP,
            physical_rows=NINETY_SIX_ROWS,
            physical_columns=NINETY_SIX_COLS,
            starting_nozzle="A12",
            back_left_nozzle="A12",
            front_right_nozzle="H12",
        ),
    )
    subject.handle_action(
        actions.UpdateCommandAction(
            private_result=configure_nozzle_private_result,
            command=configure_nozzle_layout_cmd,
        )
    )
    # Pick up partial tips
    subject.handle_action(
        actions.UpdateCommandAction(command=pick_up_tip_command, private_result=None)
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=5,
        starting_tip_name=None,
    )
    assert result == "A2"
