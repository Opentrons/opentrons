import pytest
from opentrons_shared_data.load import (
    load_shared_data_from_uri,
    load_shared_data,
    InvalidOpentronsDataURI,
    WrongDataKindError,
)


@pytest.mark.parametrize(
    "uri,path",
    [
        ("/robot/definitions/1/ot2.json", "robot/definitions/1/ot2.json"),
        (
            "/pipette/definitions/pipetteNameSpecs.json",
            "pipette/definitions/pipetteNameSpecs.json",
        ),
        (
            "/deck/definitions/3/ot3_standard.json",
            "deck/definitions/3/ot3_standard.json",
        ),
    ],
)
def test_load_from_uri(uri: str, path: str) -> None:
    assert load_shared_data_from_uri(uri) == load_shared_data(path)


@pytest.mark.parametrize(
    "uri",
    [  # bad URI
        "/asdasfasda",
        # path traversals
        "/../pipette/definitions/pipetteNameSpecs.json",
        "/pipette/../../definitions/pipetteNameSpecs.json",
        # relative URI
        "pipettes/definitions/pipetteNameSpecs.json",
        # re-rooting
        "//pipettes/definitions/pipetteNameSpecs.json",
    ],
)
def test_load_raises_on_bad_uri(uri: str) -> None:
    with pytest.raises(InvalidOpentronsDataURI):
        load_shared_data_from_uri(uri)


def test_load_filters_ok() -> None:
    data = load_shared_data_from_uri("/robot/definitions/1/ot3.json", "robot")
    assert data == load_shared_data("robot/definitions/1/ot3.json")


def test_load_filters_fail() -> None:
    with pytest.raises(WrongDataKindError):
        load_shared_data_from_uri("/pipette/definitions/pipetteNameSpecs.json", "robot")
