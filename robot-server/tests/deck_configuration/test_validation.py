"""Unit tests for robot_server.deck_configuration.validation."""

from opentrons_shared_data.deck import load as load_deck_definition

from robot_server.deck_configuration import validation as subject


def test_valid() -> None:
    """It should return an empty error list if the input is valid."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            ("singleCenterSlot", "cutoutC2"),
            ("singleCenterSlot", "cutoutD2"),
            ("stagingAreaRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            ("stagingAreaRightSlot", "cutoutC3"),
            ("singleRightSlot", "cutoutD3"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == set()


def test_invalid_empty_cutouts() -> None:
    """It should enforce that every cutout is occupied."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            # Invalid because we haven't placed anything into cutout C2 or D2.
            # ("singleCenterSlot", "cutoutC2"),
            # ("singleCenterSlot", "cutoutD2"),
            ("stagingAreaRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            ("stagingAreaRightSlot", "cutoutC3"),
            ("singleRightSlot", "cutoutD3"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == {
        subject.UnoccupiedCutoutError(cutout_id="cutoutC2"),
        subject.UnoccupiedCutoutError(cutout_id="cutoutD2"),
    }


def test_invalid_overcrowded_cutouts() -> None:
    """It should prevent you from putting multiple things into a single cutout."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            ("singleCenterSlot", "cutoutC2"),
            ("singleCenterSlot", "cutoutD2"),
            ("stagingAreaRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            # Invalid because we're placing two things in cutout C3...
            ("stagingAreaRightSlot", "cutoutC3"),
            ("stagingAreaRightSlot", "cutoutC3"),
            # ...and two things in cutout D3.
            ("wasteChuteRightAdapterNoCover", "cutoutD3"),
            ("singleRightSlot", "cutoutD3"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == {
        subject.OvercrowdedCutoutError(
            cutout_id="cutoutC3",
            cutout_fixture_ids=("stagingAreaRightSlot", "stagingAreaRightSlot"),
        ),
        subject.OvercrowdedCutoutError(
            cutout_id="cutoutD3",
            cutout_fixture_ids=("wasteChuteRightAdapterNoCover", "singleRightSlot"),
        ),
    }


def test_invalid_cutout_for_fixture() -> None:
    """Each fixture must be placed in a location that's valid for that particular fixture."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            # Invalid because wasteChuteRightAdapterNoCover can't be placed in cutout C2...
            ("wasteChuteRightAdapterNoCover", "cutoutC2"),
            # ...nor can singleLeftSlot be placed in cutout D2.
            ("singleLeftSlot", "cutoutD2"),
            ("stagingAreaRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            ("stagingAreaRightSlot", "cutoutC3"),
            ("singleRightSlot", "cutoutD3"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == {
        subject.InvalidLocationError(
            cutout_id="cutoutC2",
            cutout_fixture_id="wasteChuteRightAdapterNoCover",
            allowed_cutout_ids=frozenset(["cutoutD3"]),
        ),
        subject.InvalidLocationError(
            cutout_id="cutoutD2",
            cutout_fixture_id="singleLeftSlot",
            allowed_cutout_ids=frozenset(
                ["cutoutA1", "cutoutB1", "cutoutC1", "cutoutD1"]
            ),
        ),
    }


def test_unrecognized_cutout() -> None:
    """It should raise a sensible error if you pass a totally nonexistent cutout."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            ("singleCenterSlot", "cutoutC2"),
            ("singleCenterSlot", "cutoutD2"),
            ("singleRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            ("singleRightSlot", "cutoutC3"),
            ("singleRightSlot", "cutoutD3"),
            # Invalid because "someUnrecognizedCutout" is not defined by the deck definition.
            ("singleRightSlot", "someUnrecognizedCutout"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == {
        subject.InvalidLocationError(
            cutout_fixture_id="singleRightSlot",
            cutout_id="someUnrecognizedCutout",
            allowed_cutout_ids=frozenset(
                ["cutoutA3", "cutoutB3", "cutoutC3", "cutoutD3"]
            ),
        )
    }


def test_unrecognized_cutout_fixture() -> None:
    """It should raise a sensible error if you pass a totally nonexistent cutout fixture."""
    deck_definition = load_deck_definition("ot3_standard", version=4)
    cutout_fixtures = [
        subject.Placement(cutout_fixture_id=cutout_fixture_id, cutout_id=cutout_id)
        for cutout_fixture_id, cutout_id in [
            ("singleLeftSlot", "cutoutA1"),
            ("singleLeftSlot", "cutoutB1"),
            ("singleLeftSlot", "cutoutC1"),
            ("singleLeftSlot", "cutoutD1"),
            ("singleCenterSlot", "cutoutA2"),
            ("singleCenterSlot", "cutoutB2"),
            ("singleCenterSlot", "cutoutC2"),
            ("singleCenterSlot", "cutoutD2"),
            ("singleRightSlot", "cutoutA3"),
            ("singleRightSlot", "cutoutB3"),
            ("singleRightSlot", "cutoutC3"),
            # Invalid because "someUnrecognizedCutoutFixture" is not defined by the deck definition.
            ("someUnrecognizedCutoutFixture", "cutoutD3"),
        ]
    ]
    assert subject.get_configuration_errors(deck_definition, cutout_fixtures) == {
        subject.UnrecognizedCutoutFixtureError(
            cutout_fixture_id="someUnrecognizedCutoutFixture",
            allowed_cutout_fixture_ids=frozenset(
                [
                    "singleLeftSlot",
                    "singleCenterSlot",
                    "singleRightSlot",
                    "stagingAreaRightSlot",
                    "wasteChuteRightAdapterCovered",
                    "wasteChuteRightAdapterNoCover",
                    "stagingAreaSlotWithWasteChuteRightAdapterCovered",
                    "stagingAreaSlotWithWasteChuteRightAdapterNoCover",
                    "trashBinAdapter",
                ]
            ),
        )
    }
