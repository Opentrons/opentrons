import json
import pytest

from opentrons.calibration_storage import helpers, types


def test_hash_labware_def() -> None:
    def1a = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def1aa = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def1b = {"metadata": {"a": "blah"}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def2 = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.000033, 1 / 3]}

    # identity preserved across json serialization+deserialization
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(  # type: ignore[arg-type]
        json.loads(json.dumps(def1a, separators=(",", ":")))
    )
    # 2 instances of same def should match
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(def1aa)  # type: ignore[arg-type]
    # metadata ignored
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(def1b)  # type: ignore[arg-type]
    # different data should not match
    assert helpers.hash_labware_def(def1a) != helpers.hash_labware_def(def2)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    argnames=["uri", "expected"],
    argvalues=[
        [
            "myspace/labware_is_cool/1",
            types.UriDetails("myspace", "labware_is_cool", 1),
        ],
        ["", types.UriDetails("", "", 1)],
        ["my_totally_cool_labware", types.UriDetails("", "my_totally_cool_labware", 1)],
    ],
)
def test_details_from_uri(uri: str, expected: types.UriDetails) -> None:
    assert helpers.details_from_uri(uri) == expected
