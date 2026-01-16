"""Tests for validating Protocol Designer test fixture files."""

import json

import pytest

from protocols import ProtocolFixture, get_protocol_fixture_by_key, get_protocol_fixtures


@pytest.mark.unit
@pytest.mark.parametrize(
    "fixture",
    get_protocol_fixtures(),
    ids=lambda f: f.key,
)
def test_protocol_file_is_valid(fixture: ProtocolFixture) -> None:
    """Test that each protocol fixture file exists and has valid structure.

    Args:
        fixture: Protocol fixture record.

    This test validates:
    - The file exists
    - The file is valid JSON
    - The file has a metadata.protocolName field (if it's a protocol JSON)
    """
    full_path = fixture.path

    # Verify file exists
    assert full_path.exists(), f"Test file not found: {full_path}"

    if fixture.is_json:
        # Read and parse JSON
        with open(full_path) as f:
            content = json.load(f)

        # Verify it's a dictionary
        assert isinstance(content, dict), f"Expected JSON object, got {type(content)}"

        # If it has metadata, validate protocolName
        if "metadata" in content and isinstance(content["metadata"], dict):
            protocol_name = content["metadata"].get("protocolName")
            if protocol_name is not None:
                assert isinstance(protocol_name, str), f"protocolName should be a string, got {type(protocol_name)}"
                assert len(protocol_name) > 0, "protocolName should not be empty"
    elif fixture.is_python:
        content = full_path.read_text(encoding="utf-8", errors="replace")
        assert "DESIGNER_APPLICATION" in content, "Python protocol should include DESIGNER_APPLICATION"
    else:
        raise AssertionError(f"Unknown fixture type: {full_path}")


@pytest.mark.unit
def test_get_protocol_fixture_by_key() -> None:
    """Demonstrate retrieving a specific fixture by its key (file stem)."""
    fixture = get_protocol_fixture_by_key("doItAllV8")
    assert fixture.key == "doItAllV8"
    assert fixture.is_json
    assert not fixture.is_python
    assert fixture.path.is_absolute()
    assert fixture.path.exists()
    assert fixture.path.name == "doItAllV8.json"
    assert fixture.path.suffix == ".json"


@pytest.mark.unit
def test_get_protocol_fixture_by_key_python() -> None:
    """Demonstrate retrieving a Python fixture by its key (file stem)."""
    fixture = get_protocol_fixture_by_key("Liquid_Class_96_Channel_Test")
    assert fixture.key == "Liquid_Class_96_Channel_Test"
    assert fixture.is_python
    assert not fixture.is_json
    assert fixture.path.is_absolute()
    assert fixture.path.exists()
    assert fixture.path.name == "Liquid_Class_96_Channel_Test.py"
    assert fixture.path.suffix == ".py"
    assert "DESIGNER_APPLICATION" in fixture.path.read_text(encoding="utf-8", errors="replace")
