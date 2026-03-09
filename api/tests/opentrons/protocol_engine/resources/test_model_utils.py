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


def test_model_utils_generates_unique_id() -> None:
    """Generated IDs should be unique."""
    results = [ModelUtils().generate_id() for i in range(1000)]
    unique_results = set(results)

    assert len(results) == len(unique_results)


def test_model_utils_generates_id_with_prefix() -> None:
    """It should return an ID with the given prefix."""
    assert ModelUtils().generate_id(prefix="my-prefix-").startswith("my-prefix-")


def test_model_utils_ensures_id() -> None:
    """It should generate unique IDs only when needed."""
    subject = ModelUtils()
    assert subject.ensure_id("hello world") == "hello world"
    assert RE_UUID.match(subject.ensure_id())
    assert RE_UUID.match(subject.ensure_id(None))
