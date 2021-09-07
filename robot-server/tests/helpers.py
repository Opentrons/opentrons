"""Server test helpers."""
import json
from pydantic import BaseModel
from requests import Response as TestClientResponse
from httpx import Response as HttpxResponse
from typing import Optional, Sequence, Union


# TODO(mc, 2021-05-24): add links checking
def verify_response(
    response: Union[TestClientResponse, HttpxResponse],
    *,
    expected_data: Optional[Union[BaseModel, Sequence[BaseModel]]] = None,
    expected_errors: Optional[Union[BaseModel, Sequence[BaseModel]]] = None,
    expected_status: int,
) -> None:
    """Check that response's "data" field matches an expected model.

    Serializes to JSON via Pydantic and deserializes via json.loads so that router
    tests can assert using models directly, which allows the tests to concentrate
    on data flows.
    """
    if expected_data is not None and expected_errors is not None:
        raise ValueError(
            "Needed one of `expected_data` or `expected_errors`, but received both."
        )
    elif expected_data is None and expected_errors is None:
        raise ValueError(
            "Needed `expected_data` or `expected_errors`, but received neither."
        )

    if isinstance(expected_data, BaseModel):
        body_key = "data"
        expected_json = expected_data.json()
    elif expected_data is not None:
        body_key = "data"
        expected_json = f"[{','.join(item.json() for item in expected_data)}]"
    elif isinstance(expected_errors, BaseModel):
        body_key = "errors"
        expected_json = f"[{expected_errors.json(exclude_none=True)}]"
    elif expected_errors is not None:
        body_key = "errors"
        expected_json = (
            f"[{','.join(item.json(exclude_none=True) for item in expected_errors)}]"
        )

    assert response.json()[body_key] == json.loads(expected_json)
    assert response.status_code == expected_status
