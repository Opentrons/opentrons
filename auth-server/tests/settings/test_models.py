import pytest
from pydantic import ValidationError

from auth_server.settings.models import (
    PatchSettingsRequestData,
    SettingsResponseData,
)

MAX_NUMBER_OF_LOGIN_ATTEMPTS = 5


def test_max_number_of_login_attempts_accepts_valid_values() -> None:
    assert (
        SettingsResponseData(maxNumberOfLoginAttempts=1).maxNumberOfLoginAttempts == 1
    )
    assert (
        SettingsResponseData(
            maxNumberOfLoginAttempts=MAX_NUMBER_OF_LOGIN_ATTEMPTS
        ).maxNumberOfLoginAttempts
        == MAX_NUMBER_OF_LOGIN_ATTEMPTS
    )
    assert PatchSettingsRequestData(maxNumberOfLoginAttempts=None).model_dump(
        exclude_unset=True
    ) == {"maxNumberOfLoginAttempts": None}


@pytest.mark.parametrize("invalid_value", [0, 6, MAX_NUMBER_OF_LOGIN_ATTEMPTS + 1])
def test_patch_settings_rejects_out_of_range_login_attempts(
    invalid_value: int,
) -> None:
    with pytest.raises(ValidationError):
        PatchSettingsRequestData(maxNumberOfLoginAttempts=invalid_value)


@pytest.mark.parametrize("invalid_value", [0, 6, MAX_NUMBER_OF_LOGIN_ATTEMPTS + 1])
def test_settings_response_rejects_out_of_range_login_attempts(
    invalid_value: int,
) -> None:
    with pytest.raises(ValidationError):
        SettingsResponseData(maxNumberOfLoginAttempts=invalid_value)
