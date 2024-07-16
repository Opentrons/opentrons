"""Tests for the AddressableAreaStore+AddressableAreaState+AddressableAreaView trifecta.

The trifecta is tested here as a single unit, treating AddressableAreaState as a private
implementation detail.
"""

from opentrons_shared_data.deck.dev_types import DeckDefinitionV5

from opentrons.protocol_engine.actions.actions import SetDeckConfigurationAction
from opentrons.protocol_engine.state.addressable_areas import (
    AddressableAreaStore,
    AddressableAreaView,
)
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType


def test_deck_configuration_setting(
    ot3_standard_deck_def: DeckDefinitionV5,
) -> None:
    """You should be able to set the deck configuration with a SetDeckConfigurationAction."""
    subject = AddressableAreaStore(
        deck_configuration=[("cutoutA3", "trashBinAdapter", None)],
        config=Config(
            use_simulated_deck_config=False,
            # Doesn't matter:
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
        ),
        deck_definition=ot3_standard_deck_def,
    )
    subject_view = AddressableAreaView(subject.state)

    assert subject_view.get_all_cutout_fixtures() == ["trashBinAdapter"]

    # The new deck configuration should overwrite the old one.
    subject.handle_action(
        SetDeckConfigurationAction(
            deck_configuration=[
                ("cutoutA3", "trashBinAdapter", None),
                ("cutoutB3", "singleRightSlot", None),
            ],
        )
    )
    assert sorted(subject_view.get_all_cutout_fixtures() or []) == [
        "singleRightSlot",
        "trashBinAdapter",
    ]

    # Deck configurations of None should no-op.
    subject.handle_action(
        SetDeckConfigurationAction(
            deck_configuration=None,
        )
    )
    assert sorted(subject_view.get_all_cutout_fixtures() or []) == [
        "singleRightSlot",
        "trashBinAdapter",
    ]
