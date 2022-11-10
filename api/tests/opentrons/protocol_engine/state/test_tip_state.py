"""Tests for tip state store and selectors."""
import pytest

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.state.tips import TipStore, TipView


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
        ]
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
    """Get a load labware command value object."""
    return commands.PickUpTip.construct(  # type: ignore[call-arg]
        params=commands.PickUpTipParams.construct(  # type: ignore[call-arg]
            labwareId="cool-labware",
            wellName="A1",
        ),
        result=commands.PickUpTipResult.construct(),
    )


@pytest.fixture
def drop_tip_command() -> commands.DropTip:
    """Get a load labware command value object."""
    return commands.DropTip.construct(  # type: ignore[call-arg]
        params=commands.DropTipParams.construct(  # type: ignore[call-arg]
            labwareId="cool-labware",
            wellName="A1",
        ),
        result=commands.DropTipResult.construct(),
    )


@pytest.mark.parametrize(
    "labware_definition",
    [LabwareDefinition.construct(ordering=[])],  # type: ignore[call-arg]
)
def test_get_next_tip_returns_none(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=False,
        starting_tip_name=None,
    )

    assert result is None


def test_get_next_tip_returns_first_tip(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should start at the first tip in the labware."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=False,
        starting_tip_name=None,
    )

    assert result == "A1"


def test_get_next_tip_used_starting_tip(
    load_labware_command: commands.LoadLabware, subject: TipStore
) -> None:
    """It should start searching at the given starting tip."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=False,
        starting_tip_name="B1",
    )

    assert result == "B1"


def test_get_next_tip_skips_picked_up_tip(
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
    subject: TipStore,
) -> None:
    """It should get the next tip in the column if one has been picked up."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=False,
        starting_tip_name=None,
    )

    assert result == "B1"


def test_get_next_tip_with_column(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
) -> None:
    """It should return the first tip in a column if column is needed."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=True,
        starting_tip_name=None,
    )

    assert result == "A2"


def test_get_next_tip_with_column_and_starting_tip(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
) -> None:
    """It should return the first tip in a column, taking starting tip into account."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=True,
        starting_tip_name="D1",
    )

    assert result == "A2"


def test_reset_tips(
    subject: TipStore,
    load_labware_command: commands.LoadLabware,
    pick_up_tip_command: commands.PickUpTip,
) -> None:
    """It should be able to reset tip tracking state."""
    subject.handle_action(actions.UpdateCommandAction(command=load_labware_command))
    subject.handle_action(actions.UpdateCommandAction(command=pick_up_tip_command))
    subject.handle_action(actions.ResetTipsAction(labware_id="cool-labware"))

    result = TipView(subject.state).get_next_tip(
        labware_id="cool-labware",
        use_column=False,
        starting_tip_name=None,
    )

    assert result == "A1"
