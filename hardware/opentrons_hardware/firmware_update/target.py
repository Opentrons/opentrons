"""Firmware update target."""
from dataclasses import dataclass

from opentrons_hardware.firmware_bindings import NodeId


@dataclass
class Target:
    """Pair of a sub-system's node id with its bootloader's node id."""

    system_node: NodeId
    bootloader_node: NodeId

    @classmethod
    def from_single_node(cls, node: NodeId) -> "Target":
        """Build a Target from just one of its node ids."""
        assert node not in (
            NodeId.broadcast,
            NodeId.host,
        ), f"Invalid update target {node}"
        return cls(
            system_node=node.application_for(), bootloader_node=node.bootloader_for()
        )
