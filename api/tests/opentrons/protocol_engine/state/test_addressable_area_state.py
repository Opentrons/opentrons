"""Tests for the AddressableAreaStore+AddressableAreaState+AddressableAreaView trifecta.

The trifecta is tested here as a single unit, treating AddressableAreaState as a private
implementation detail.
"""

from opentrons_shared_data.deck.types import DeckDefinitionV5

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
        robot_definition={
            "displayName": "OT-3",
            "robotType": "OT-3 Standard",
            "models": ["OT-3 Standard"],
            "extents": [477.2, 493.8, 0.0],
            "paddingOffsets": {
                "rear": -177.42,
                "front": 51.8,
                "leftSide": 31.88,
                "rightSide": -80.32,
            },
            "mountOffsets": {
                "left": [-13.5, -60.5, 255.675],
                "right": [40.5, -60.5, 255.675],
                "gripper": [84.55, -12.75, 93.85],
            },
        },
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
