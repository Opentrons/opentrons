"""Simple functional tests for the IdGenerator provider."""
import re
from opentrons.protocol_engine.resources import IdGenerator

RE_UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    flags=re.IGNORECASE
)


def test_id_generator_generates_uuid() -> None:
    """It should generate a string matching a UUID."""
    result = IdGenerator().generate_id()

    assert RE_UUID.match(result)


def test_id_generator_generates_unique() -> None:
    """It should generate unique IDs."""
    results = [IdGenerator().generate_id() for i in range(1000)]
    unique_results = set(results)

    assert len(results) == len(unique_results)
