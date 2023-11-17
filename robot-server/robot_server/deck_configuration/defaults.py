"""Default deck configurations."""


from . import models


_for_flex = models.DeckConfigurationRequest.construct(
    cutoutFixtures=[
        models.CutoutFixture.construct(
            cutoutId="cutoutA1", cutoutFixtureId="singleLeftSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutB1", cutoutFixtureId="singleLeftSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutC1", cutoutFixtureId="singleLeftSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutD1", cutoutFixtureId="singleLeftSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutA2", cutoutFixtureId="singleCenterSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutB2", cutoutFixtureId="singleCenterSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutC2", cutoutFixtureId="singleCenterSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutD2", cutoutFixtureId="singleCenterSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutA3", cutoutFixtureId="trashBinAdapter"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutB3", cutoutFixtureId="singleRightSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutC3", cutoutFixtureId="singleRightSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutoutD3", cutoutFixtureId="singleRightSlot"
        ),
    ]
)


_for_ot2 = models.DeckConfigurationRequest.construct(
    cutoutFixtures=[
        models.CutoutFixture.construct(
            cutoutId="cutout1", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout2", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout3", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout4", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout5", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout6", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout7", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout8", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout9", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout10", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout11", cutoutFixtureId="singleStandardSlot"
        ),
        models.CutoutFixture.construct(
            cutoutId="cutout12", cutoutFixtureId="fixedTrashSlot"
        ),
    ]
)


def for_deck_definition(deck_definition_name: str) -> models.DeckConfigurationRequest:
    """Return a default configuration for the given deck definition.

    When a user has not yet configured which fixtures are on a robot, the robot should fall back to
    this for the purposes of running protocols.

    Protocol analysis should *not* use this default. Analysis is supposed to *determine* the
    protocol's deck configuration requirements, instead of assuming some default.

    Params:
        deck_definition_name: The name of a deck definition loadable through
            `opentrons_shared_data.deck`.
    """
    try:
        return {
            "ot2_standard": _for_ot2,
            "ot2_short_trash": _for_ot2,
            "ot3_standard": _for_flex,
        }[deck_definition_name]
    except KeyError as exception:
        # This shouldn't happen. Every deck definition that a robot might have should have a
        # default configuration.
        raise ValueError(
            f"The deck {deck_definition_name} has no default configuration."
        ) from exception
