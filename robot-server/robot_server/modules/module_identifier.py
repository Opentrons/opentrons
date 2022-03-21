"""Identify hardware modules in the robot server."""
from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class ModuleIdentity:
    """Unique identifying features of an attached module."""

    module_id: str
    serial_number: str
    firmware_version: str
    hardware_revision: str


class ModuleIdentifier:
    """Hardware control interface to logical identifier mapping."""

    @staticmethod
    def identify(device_info: Mapping[str, str]) -> ModuleIdentity:
        """Identify a module based on its hardware control device info."""
        serial_number = device_info.get("serial")
        firmware_version = device_info.get("version")
        hardware_revision = device_info.get("model")

        assert serial_number, f"Expected serial number in {device_info}"
        assert firmware_version, f"Expected firmware version in {device_info}"
        assert hardware_revision, f"Expected hardware revision in {device_info}"

        return ModuleIdentity(
            module_id=ModuleIdentifier._generate_id(serial_number, hardware_revision),
            serial_number=serial_number,
            firmware_version=firmware_version,
            hardware_revision=hardware_revision,
        )

    @staticmethod
    def _generate_id(serial_number: str, hardware_revision: str) -> str:
        return f"module{hash((serial_number, hardware_revision))}"
