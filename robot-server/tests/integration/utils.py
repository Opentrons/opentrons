"""Helper functions for use inside Tavern tests.

https://tavern.readthedocs.io/en/latest/basics.html#calling-external-functions
"""

from box import Box
from requests import Response


def verify_settings_value(response: Response, id: str, value: str) -> None:
    """Verify settings are updated as expectted"""
    for setting in response.json().get("settings"):
        if setting.get("id") == id:
            assert str(setting.get("value")) == str(value)
            return
    assert False


def verify_pipette_calibration_response(response: Response) -> None:
    """Verify we get an unordered list of pipette calibrations."""
    assert response.json().get("links") is None
    for pipette_offsets in response.json().get("data"):
        assert pipette_offsets.get("mount") in ["left", "right"]
        assert pipette_offsets.get("pipette") in ["123", "321"]
        assert pipette_offsets.get("offset") == [0.0, 0.0, 0.0]
        assert pipette_offsets.get("source") == "user"
        return
    assert False


def find_labware_definition(response: Response, load_name: str) -> Box:
    """Search a `GET /protocols/:id/analyses/:id` response for the given labware definition.

    Return that labware definition, making it available to the .tavern.yaml file as
    {labware_definition}.
    """
    for command in response.json()["data"]["commands"]:
        if (
            command["commandType"] == "loadLabware"
            and command["params"]["loadName"] == load_name
        ):
            return Box({"labware_definition": command["result"]["definition"]})

    assert False, f"No loadLabware command found with load_name {load_name}."
