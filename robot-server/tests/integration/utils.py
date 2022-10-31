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
