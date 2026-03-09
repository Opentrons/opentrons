"""Tests for tip state store and selectors."""

from typing import Optional

import pytest

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
)
from opentrons_shared_data.labware.labware_definition import (
    Parameters2 as LabwareDefinition2Parameters,
)
from opentrons_shared_data.pipette.pipette_definition import (
    AvailableSensorDefinition,
    ValidNozzleMaps,
)
from opentrons_shared_data.pipette.types import PipetteNameType

from ..pipette_fixtures import (
    NINETY_SIX_COLS,
    NINETY_SIX_MAP,
    NINETY_SIX_ROWS,
    get_default_nozzle_map,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.tips import TipStore, TipView
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    DeckSlotLocation,
    TipRackWellState,
)
from opentrons.types import DeckSlotName

_tip_rack_parameters = LabwareDefinition2Parameters.model_construct(isTiprack=True)  # type: ignore[call-arg]


@pytest.fixture
def available_sensors() -> AvailableSensorDefinition:
    """Provide a list of sensors."""
    return AvailableSensorDefinition(sensors=["pressure", "capacitive", "environment"])


@pytest.fixture
def subject() -> TipStore:
    """Get a TipStore test subject."""
    return TipStore()


@pytest.fixture
def labware_definition() -> LabwareDefinition:
    """Get a labware definition value object."""
    return LabwareDefinition2.model_construct(  # type: ignore[call-arg]
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
def load_labware_action(
    labware_definition: LabwareDefinition,
) -> actions.SucceedCommandAction:
    """Get a load labware command value object."""
    return actions.SucceedCommandAction(
        command=_dummy_command(),
        state_update=update_types.StateUpdate(
            loaded_labware=update_types.LoadedLabwareUpdate(
                labware_id="cool-labware",
                definition=labware_definition,
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
                display_name=None,
                offset_id=None,
            )
        ),
    )


def _dummy_command() -> commands.Command:
    """Return a placeholder command."""
    return commands.Comment.model_construct()  # type: ignore[call-arg]


@pytest.mark.parametrize(
    "labware_definition",
    [LabwareDefinition2.model_construct(ordering=[], parameters=_tip_rack_parameters)],  # type: ignore[call-arg]
)
def test_get_next_tip_returns_none(
    load_labware_action: actions.SucceedCommandAction,
    subject: TipStore,
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name=None,
        nozzle_map=None,
    )

    assert result is None


@pytest.mark.parametrize("input_tip_amount", [1, 8, 96])
def test_get_next_tip_returns_first_tip(
    load_labware_action: actions.SucceedCommandAction,
    subject: TipStore,
    input_tip_amount: int,
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=input_tip_amount,
        starting_tip_name=None,
        nozzle_map=None,
    )

    assert result == "A1"


@pytest.mark.parametrize("input_tip_amount, result_well_name", [(1, "B1"), (8, "A2")])
def test_get_next_tip_used_starting_tip(
    load_labware_action: actions.SucceedCommandAction,
    subject: TipStore,
    input_tip_amount: int,
    result_well_name: str,
) -> None:
    """It should start searching at the given starting tip."""
    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=input_tip_amount,
        starting_tip_name="B1",
        nozzle_map=None,
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
    load_labware_action: actions.SucceedCommandAction,
    subject: TipStore,
    input_tip_amount: int,
    get_next_tip_tips: int,
    input_starting_tip: Optional[str],
    result_well_name: Optional[str],
) -> None:
    """It should get the next tip in the column if one has been picked up."""
    subject.handle_action(load_labware_action)

    if input_starting_tip is not None:
        if input_tip_amount == 1:
            pipette_name_type = PipetteNameType.P300_SINGLE_GEN2
        elif input_tip_amount == 8:
            pipette_name_type = PipetteNameType.P300_MULTI_GEN2
        else:
            pipette_name_type = PipetteNameType.P1000_96
    else:
        if get_next_tip_tips == 1:
            pipette_name_type = PipetteNameType.P300_SINGLE_GEN2
        elif get_next_tip_tips == 8:
            pipette_name_type = PipetteNameType.P300_MULTI_GEN2
        else:
            pipette_name_type = PipetteNameType.P1000_96

    nozzle_map = get_default_nozzle_map(pipette_name_type)

    pick_up_tip_state_update = update_types.StateUpdate(
        tips_state=update_types.TipsStateUpdate(
            tip_state=TipRackWellState.EMPTY,
            labware_id="cool-labware",
            well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                labware_id="cool-labware", well_name="A1", nozzle_map=nozzle_map
            ),
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=pick_up_tip_state_update,
        )
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=get_next_tip_tips,
        starting_tip_name=input_starting_tip,
        nozzle_map=nozzle_map,
    )

    assert result == result_well_name


def test_get_next_tip_with_starting_tip(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return the starting tip, and then the following tip after that."""
    nozzle_map = get_default_nozzle_map(PipetteNameType.P300_SINGLE_GEN2)

    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="B2",
        nozzle_map=nozzle_map,
    )
    assert result == "B2"

    pick_up_tip_state_update = update_types.StateUpdate(
        tips_state=update_types.TipsStateUpdate(
            tip_state=TipRackWellState.EMPTY,
            labware_id="cool-labware",
            well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                labware_id="cool-labware", well_name="B2", nozzle_map=nozzle_map
            ),
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=pick_up_tip_state_update,
        )
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="B2",
        nozzle_map=nozzle_map,
    )
    assert result == "C2"


def test_get_next_tip_with_starting_tip_8_channel(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return the starting tip, and then the following tip after that."""
    nozzle_map = get_default_nozzle_map(PipetteNameType.P300_MULTI_GEN2)

    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="A2",
        nozzle_map=None,
    )
    assert result == "A2"

    pick_up_tip_state_update = update_types.StateUpdate(
        tips_state=update_types.TipsStateUpdate(
            tip_state=TipRackWellState.EMPTY,
            labware_id="cool-labware",
            well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                labware_id="cool-labware", well_name="A2", nozzle_map=nozzle_map
            ),
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=pick_up_tip_state_update,
        )
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="A2",
        nozzle_map=None,
    )

    assert result == "A3"


def test_get_next_tip_with_1_channel_followed_by_8_channel(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return the first tip of column 2 for the 8 channel after performing a single tip pickup on column 1."""
    nozzle_map_1_channel = get_default_nozzle_map(PipetteNameType.P300_SINGLE_GEN2)
    nozzle_map_8_channel = get_default_nozzle_map(PipetteNameType.P300_MULTI_GEN2)

    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name=None,
        nozzle_map=nozzle_map_1_channel,
    )
    assert result == "A1"

    pick_up_tip_1_channel_state_update = update_types.StateUpdate(
        tips_state=update_types.TipsStateUpdate(
            tip_state=TipRackWellState.EMPTY,
            labware_id="cool-labware",
            well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                labware_id="cool-labware",
                well_name="A1",
                nozzle_map=nozzle_map_1_channel,
            ),
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=pick_up_tip_1_channel_state_update,
        )
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name=None,
        nozzle_map=nozzle_map_8_channel,
    )
    assert result == "A2"


def test_get_next_tip_with_starting_tip_out_of_tips(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return the starting tip of H12 and then None after that."""
    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="H12",
        nozzle_map=None,
    )
    assert result == "H12"

    pick_up_tip_state_update = update_types.StateUpdate(
        tips_state=update_types.TipsStateUpdate(
            tip_state=TipRackWellState.EMPTY,
            labware_id="cool-labware",
            well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                labware_id="cool-labware",
                well_name="H12",
                nozzle_map=get_default_nozzle_map(PipetteNameType.P300_SINGLE_GEN2),
            ),
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=pick_up_tip_state_update,
        )
    )

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=1,
        starting_tip_name="H12",
        nozzle_map=None,
    )

    assert result is None


def test_get_next_tip_with_column_and_starting_tip(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return the first tip in a column, taking starting tip into account."""
    subject.handle_action(load_labware_action)

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        num_tips=8,
        starting_tip_name="D1",
        nozzle_map=None,
    )

    assert result == "A2"


@pytest.mark.parametrize(
    "labware_definition",
    [
        LabwareDefinition2.model_construct(  # type: ignore[call-arg]
            ordering=[["A1"]],
            parameters=LabwareDefinition2Parameters.model_construct(isTiprack=False),  # type: ignore[call-arg]
        )
    ],
)
def test_has_tip_not_tip_rack(
    load_labware_action: actions.SucceedCommandAction, subject: TipStore
) -> None:
    """It should return False if labware isn't a tip rack."""
    subject.handle_action(load_labware_action)

    result = TipView(state=subject.state).has_clean_tip("cool-labware", "A1")

    assert result is False


def test_has_tip_tip_rack(
    load_labware_action: actions.SucceedCommandAction, subject: TipStore
) -> None:
    """It should return False if labware isn't a tip rack."""
    subject.handle_action(load_labware_action)

    result = TipView(state=subject.state).has_clean_tip("cool-labware", "A1")

    assert result is True


def test_next_tip_automatic_tip_tracking_with_partial_configurations(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """Test tip tracking logic using multiple pipette configurations."""
    subject.handle_action(load_labware_action)

    def _assert_and_pickup(expected_next_tip: str, nozzle_map: NozzleMap) -> None:
        result = TipView(subject.state).get_next_tip(
            labware_id="cool-labware",
            num_tips=0,
            starting_tip_name=None,
            nozzle_map=nozzle_map,
        )
        assert result is not None and result == expected_next_tip

        pick_up_tip_state_update = update_types.StateUpdate(
            tips_state=update_types.TipsStateUpdate(
                tip_state=TipRackWellState.EMPTY,
                labware_id="cool-labware",
                well_names=TipView(subject.state).compute_tips_to_mark_as_used_or_empty(
                    labware_id="cool-labware", well_name=result, nozzle_map=nozzle_map
                ),
            )
        )

        subject.handle_action(
            actions.SucceedCommandAction(
                command=_dummy_command(),
                state_update=pick_up_tip_state_update,
            )
        )

    def _build_nozzle_map(start: str, back_l: str, front_r: str) -> NozzleMap:
        return NozzleMap.build(
            physical_nozzles=NINETY_SIX_MAP,
            physical_rows=NINETY_SIX_ROWS,
            physical_columns=NINETY_SIX_COLS,
            starting_nozzle=start,
            back_left_nozzle=back_l,
            front_right_nozzle=front_r,
            valid_nozzle_maps=ValidNozzleMaps(
                maps={
                    "A1": ["A1"],
                    "H1": ["H1"],
                    "A12": ["A12"],
                    "H12": ["H12"],
                    "A1_H3": [
                        "A1",
                        "A2",
                        "A3",
                        "B1",
                        "B2",
                        "B3",
                        "C1",
                        "C2",
                        "C3",
                        "D1",
                        "D2",
                        "D3",
                        "E1",
                        "E2",
                        "E3",
                        "F1",
                        "F2",
                        "F3",
                        "G1",
                        "G2",
                        "G3",
                        "H1",
                        "H2",
                        "H3",
                    ],
                    "A1_F2": [
                        "A1",
                        "A2",
                        "B1",
                        "B2",
                        "C1",
                        "C2",
                        "D1",
                        "D2",
                        "E1",
                        "E2",
                        "F1",
                        "F2",
                    ],
                }
            ),
        )

    pipette_nozzle_map = _build_nozzle_map("A1", "A1", "H3")
    _assert_and_pickup("A10", pipette_nozzle_map)
    pipette_nozzle_map = _build_nozzle_map("A1", "A1", "F2")
    _assert_and_pickup("C8", pipette_nozzle_map)

    # Configure to single tip pickups
    pipette_nozzle_map = _build_nozzle_map("H12", "H12", "H12")
    _assert_and_pickup("A1", pipette_nozzle_map)
    pipette_nozzle_map = _build_nozzle_map("H1", "H1", "H1")
    _assert_and_pickup("A9", pipette_nozzle_map)
    pipette_nozzle_map = _build_nozzle_map("A12", "A12", "A12")
    _assert_and_pickup("H1", pipette_nozzle_map)
    pipette_nozzle_map = _build_nozzle_map("A1", "A1", "A1")
    _assert_and_pickup("B9", pipette_nozzle_map)


def test_next_tip_automatic_tip_tracking_tiprack_limits(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """Ensure once a tip rack is consumed it returns None when consuming tips using multiple pipette configurations."""
    # Load labware
    subject.handle_action(load_labware_action)

    def _get_next_and_pickup(nozzle_map: NozzleMap) -> str | None:
        result = TipView(subject.state).get_next_tip(
            labware_id="cool-labware",
            num_tips=0,
            starting_tip_name=None,
            nozzle_map=nozzle_map,
        )
        if result is not None:
            pick_up_tip_state_update = update_types.StateUpdate(
                tips_state=update_types.TipsStateUpdate(
                    tip_state=TipRackWellState.EMPTY,
                    labware_id="cool-labware",
                    well_names=TipView(
                        subject.state
                    ).compute_tips_to_mark_as_used_or_empty(
                        labware_id="cool-labware",
                        well_name=result,
                        nozzle_map=nozzle_map,
                    ),
                )
            )

            subject.handle_action(
                actions.SucceedCommandAction(
                    command=_dummy_command(),
                    state_update=pick_up_tip_state_update,
                )
            )

        return result

    def _build_nozzle_map(start: str, back_l: str, front_r: str) -> NozzleMap:
        return NozzleMap.build(
            physical_nozzles=NINETY_SIX_MAP,
            physical_rows=NINETY_SIX_ROWS,
            physical_columns=NINETY_SIX_COLS,
            starting_nozzle=start,
            back_left_nozzle=back_l,
            front_right_nozzle=front_r,
            valid_nozzle_maps=ValidNozzleMaps(
                maps={
                    "A1": ["A1"],
                    "H1": ["H1"],
                    "A12": ["A12"],
                    "H12": ["H12"],
                    "Full": sum(
                        [
                            NINETY_SIX_ROWS["A"],
                            NINETY_SIX_ROWS["B"],
                            NINETY_SIX_ROWS["C"],
                            NINETY_SIX_ROWS["D"],
                            NINETY_SIX_ROWS["E"],
                            NINETY_SIX_ROWS["F"],
                            NINETY_SIX_ROWS["G"],
                            NINETY_SIX_ROWS["H"],
                        ],
                        [],
                    ),
                }
            ),
        )

    pipette_nozzle_map = _build_nozzle_map("A1", "A1", "A1")
    for _ in range(96):
        assert _get_next_and_pickup(pipette_nozzle_map) is not None
    assert _get_next_and_pickup(pipette_nozzle_map) is None

    subject.handle_action(load_labware_action)
    pipette_nozzle_map = _build_nozzle_map("A12", "A12", "A12")
    for _ in range(96):
        assert _get_next_and_pickup(pipette_nozzle_map) is not None
    assert _get_next_and_pickup(pipette_nozzle_map) is None

    subject.handle_action(load_labware_action)
    pipette_nozzle_map = _build_nozzle_map("H1", "H1", "H1")
    for _ in range(96):
        assert _get_next_and_pickup(pipette_nozzle_map) is not None
    assert _get_next_and_pickup(pipette_nozzle_map) is None

    subject.handle_action(load_labware_action)
    pipette_nozzle_map = _build_nozzle_map("H12", "H12", "H12")
    for _ in range(96):
        assert _get_next_and_pickup(pipette_nozzle_map) is not None
    assert _get_next_and_pickup(pipette_nozzle_map) is None


def test_96_column_after_row_returns_none(
    subject: TipStore,
    load_labware_action: actions.SucceedCommandAction,
) -> None:
    """It should return None when there's no valid columns to pick up."""
    subject.handle_action(load_labware_action)

    def _get_next_and_pickup(nozzle_map: NozzleMap) -> str | None:
        result = TipView(subject.state).get_next_tip(
            labware_id="cool-labware",
            num_tips=0,
            starting_tip_name=None,
            nozzle_map=nozzle_map,
        )
        if result is not None:
            pick_up_tip_state_update = update_types.StateUpdate(
                tips_state=update_types.TipsStateUpdate(
                    tip_state=TipRackWellState.EMPTY,
                    labware_id="cool-labware",
                    well_names=TipView(
                        subject.state
                    ).compute_tips_to_mark_as_used_or_empty(
                        labware_id="cool-labware",
                        well_name=result,
                        nozzle_map=nozzle_map,
                    ),
                )
            )

            subject.handle_action(
                actions.SucceedCommandAction(
                    command=_dummy_command(),
                    state_update=pick_up_tip_state_update,
                )
            )

        return result

    row_nozzle_map = NozzleMap.build(
        physical_nozzles=NINETY_SIX_MAP,
        physical_rows=NINETY_SIX_ROWS,
        physical_columns=NINETY_SIX_COLS,
        starting_nozzle="A1",
        back_left_nozzle="A1",
        front_right_nozzle="A12",
        valid_nozzle_maps=ValidNozzleMaps(maps={"RowA": NINETY_SIX_ROWS["A"]}),
    )
    assert _get_next_and_pickup(row_nozzle_map) is not None

    col_nozzle_map = NozzleMap.build(
        physical_nozzles=NINETY_SIX_MAP,
        physical_rows=NINETY_SIX_ROWS,
        physical_columns=NINETY_SIX_COLS,
        starting_nozzle="A1",
        back_left_nozzle="A1",
        front_right_nozzle="H1",
        valid_nozzle_maps=ValidNozzleMaps(maps={"Column1": NINETY_SIX_COLS["1"]}),
    )
    assert _get_next_and_pickup(col_nozzle_map) is None


def test_handle_batch_labware_loaded_update(
    subject: TipStore, labware_definition: LabwareDefinition
) -> None:
    """It should consume batch_loaded_labware updates."""
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=update_types.StateUpdate(
                batch_loaded_labware=update_types.BatchLoadedLabwareUpdate(
                    new_locations_by_id={
                        "some-labware-id": DeckSlotLocation(
                            slotName=DeckSlotName.SLOT_1
                        ),
                        "some-other-labware-id": OFF_DECK_LOCATION,
                    },
                    offset_ids_by_id={
                        "some-labware-id": "some-offset-id",
                        "some-other-labware-id": None,
                    },
                    display_names_by_id={
                        "some-labware-id": "some-display-name",
                        "some-other-labware-id": None,
                    },
                    definitions_by_id={
                        "some-labware-id": labware_definition,
                        "some-other-labware-id": labware_definition,
                    },
                )
            ),
        )
    )

    # The use of has_clean_tip() is arbitrary here. We just need anything that can make
    # sure each labware in the batch has actually been ingested.
    assert TipView(subject.state).has_clean_tip("some-labware-id", "A1")
    assert TipView(subject.state).has_clean_tip("some-other-labware-id", "A1")
