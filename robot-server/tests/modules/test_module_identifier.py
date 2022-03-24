"""Tests for robot_server.modules.module_identifier."""
import pytest
from decoy import matchers
from typing import Optional

from robot_server.modules.module_identifier import ModuleIdentifier, ModuleIdentity


def test_parses_device_info() -> None:
    """It should parse module, serial, and versions out of device info dict."""
    subject = ModuleIdentifier()

    device_info = {
        "serial": "abc123",
        "version": "1.2.3",
        "model": "4.5.6",
    }

    result = subject.identify(device_info)

    assert result == ModuleIdentity(
        module_id=matchers.IsA(str),
        serial_number="abc123",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )


@pytest.mark.parametrize("omission", ["serial", "version", "model"])
def test_asserts_if_device_info_bad(omission: str) -> None:
    """It should raise an assertion error if device_info is bad."""
    subject = ModuleIdentifier()

    device_info = {
        "serial": "abc123",
        "version": "1.2.3",
        "model": "4.5.6",
    }

    device_info.pop(omission)

    with pytest.raises(AssertionError):
        subject.identify(device_info)


@pytest.mark.parametrize(
    ("field_to_change", "should_equal"),
    [(None, True), ("serial", False), ("version", True), ("model", False)],
)
def test_assigns_persistent_ids(
    field_to_change: Optional[str],
    should_equal: bool,
) -> None:
    """It should assign persistent IDs based on serial and hardware revision."""
    subject = ModuleIdentifier()

    device_info = {
        "serial": "abc123",
        "version": "1.2.3",
        "model": "4.5.6",
    }

    device_info_changed = device_info.copy()
    if field_to_change is not None:
        device_info_changed[field_to_change] = "oh no"

    if should_equal:
        assert (
            subject.identify(device_info).module_id
            == subject.identify(device_info_changed).module_id
        )
    else:
        assert (
            subject.identify(device_info).module_id
            != subject.identify(device_info_changed).module_id
        )
