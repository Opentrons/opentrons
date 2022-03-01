"""Simple functional tests for the ModelUtils provider."""
import re
from opentrons.protocol_engine.resources import ModelUtils

RE_UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    flags=re.IGNORECASE,
)


def test_model_utils_generates_fake_serial() -> None:
    """It should generate a string that's visibly a fake serial number."""
    result = ModelUtils().generate_fake_serial_number()
    assert "fake-serial-number" in result
    assert result != "fake-serial-number"


def test_model_utils_generates_unique_fake_serial() -> None:
    """Generated serial numbers should be unique."""
    results = [ModelUtils().generate_id() for i in range(1000)]
    unique_results = set(results)

    assert len(results) == len(unique_results)


def test_model_utils_generates_id() -> None:
    """It should generate a string matching a UUID."""
    result = ModelUtils().generate_id()

    assert RE_UUID.match(result)


def test_model_utils_generates_unique_id() -> None:
    """Generated IDs should be unique."""
    results = [ModelUtils().generate_id() for i in range(1000)]
    unique_results = set(results)

    assert len(results) == len(unique_results)


def test_model_utils_ensures_id() -> None:
    """It should generate unique IDs only when needed."""
    subject = ModelUtils()
    assert subject.ensure_id("hello world") == "hello world"
    assert RE_UUID.match(subject.ensure_id())
    assert RE_UUID.match(subject.ensure_id(None))
