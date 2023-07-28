"""Tests that we have all errors in our python bindings."""

import json

import pytest

from opentrons_shared_data.load import load_shared_data
from opentrons_shared_data.errors.codes import ErrorCodes


error_json = json.loads(load_shared_data("errors/definitions/1/errors.json"))


@pytest.mark.parametrize("code", list(error_json["codes"].keys()))
def check_error_present_and_correct(code: str) -> None:
    """Test that each error in json is retrievable."""
    error = ErrorCodes.by_error_code(code)
    assert error.value.code == code
    assert error.value.category.value.name == error_json["code"]["category"]
