from requests import Response


def verify_settings_value(response: Response, id: str, value: str) -> None:
    """Verify settings are updated as expectted"""
    for setting in response.json().get("settings"):
        if setting.get("id") == id:
            assert str(setting.get("value")) == str(value)
            return
    assert False
