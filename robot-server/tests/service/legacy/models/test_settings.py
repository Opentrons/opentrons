import pytest

from robot_server.service.legacy.models import settings


@pytest.fixture(
    scope="session",
    params=[
        "top",
        "bottom",
        "blowout",
        "dropTip",
        "pickUpCurrent",
        "pickUpDistance",
        "pickUpIncrement",
        "pickUpPresses",
        "pickUpSpeed",
        "plungerCurrent",
        "dropTipCurrent",
        "dropTipSpeed",
        "tipLength",
        "quirks",
    ],
)
def mutable_config(request) -> str:
    return request.param


@pytest.fixture(
    scope="session",
    params=["pickupTipShake", "dropTipShake", "doubleDropTip", "needsUnstick"],
)
def valid_quirk(request) -> str:
    return request.param


def test_pipette_settings_update_fields_pass(mutable_config: str):
    """Should make mutable config bool like values into a float."""
    s = settings.PipetteSettingsUpdate(fields={mutable_config: {"value": 1.0}})
    assert s.setting_fields[mutable_config].value == 1.0
    assert isinstance(s.setting_fields[mutable_config].value, float)


def test_pipette_settings_update_quirks_only_bool(valid_quirk: str):
    """Should reject non-boolean quirk values."""
    with pytest.raises(ValueError):
        settings.PipetteSettingsUpdate(fields={valid_quirk: {"value": 1.3}})


def test_pipette_settings_update_quirks_pass(valid_quirk: str):
    """Should accept quirk bool."""
    s = settings.PipetteSettingsUpdate(fields={valid_quirk: {"value": True}})
    assert s.setting_fields[valid_quirk].value is True


def test_pipette_settings_update_none(mutable_config: str):
    """Should accept none values."""
    s = settings.PipetteSettingsUpdate(fields={mutable_config: None})
    assert s.setting_fields[mutable_config] is None


def test_pipette_settings_update_none_value(mutable_config: str):
    """Should accept none values."""
    s = settings.PipetteSettingsUpdate(fields={mutable_config: {"value": None}})
    assert s.setting_fields[mutable_config].value is None
