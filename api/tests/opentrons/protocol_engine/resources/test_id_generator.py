"""Simple functional tests for the ModelUtils provider."""
import re
from opentrons.protocol_engine.resources import ModelUtils

RE_UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    flags=re.IGNORECASE,
)


def test_model_utils_generates_uuid() -> None:
    """It should generate a string matching a UUID."""
    result = ModelUtils().generate_id()

    assert RE_UUID.match(result)


def test_model_utils_generates_unique() -> None:
    """It should generate unique IDs."""
    results = [ModelUtils().generate_id() for i in range(1000)]
    unique_results = set(results)

    assert len(results) == len(unique_results)
