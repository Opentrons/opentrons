"""Test for constants module."""
from typing import Iterable

import pytest

from opentrons_hardware.firmware_bindings import constants
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.arbitration_id import (
    NODE_ID_BITS,
    MESSAGE_ID_BITS,
    FUNCTION_CODE_BITS,
)


@pytest.mark.parametrize(
    argnames=["subject", "bit_width"],
    argvalues=[
        [constants.NodeId, NODE_ID_BITS],
        [constants.MessageId, MESSAGE_ID_BITS],
        [constants.FunctionCode, FUNCTION_CODE_BITS],
    ],
)
def test_range(subject: Iterable[int], bit_width: int) -> None:
    """Each value must be in range."""
    mask = (2**bit_width) - 1
    for v in subject:
        assert (v & ~mask) == 0, f"{v} must be between 0 and {mask}"


@pytest.mark.parametrize("node_id", [n for n in NodeId if n.is_bootloader()])
def test_is_bootloader(node_id: NodeId) -> None:
    """Test that we correctly identify a node as bootloader or not."""
    # broadcast and host nodes do not have a bootloader node id
    assert node_id not in {
        NodeId.broadcast,
        NodeId.host,
    }, "No bootloader for these nodes"

    # Make sure we have the bootloader node in our above list
    assert node_id in NodeId.bootloader_map(), f"bootloader node {node_id} not found"


@pytest.mark.parametrize("node_id", [n.application_for() for n in NodeId])
def test_bootloader_for(node_id: NodeId) -> None:
    """Test application node id to bootloader node id mapping."""
    # There is no bootloader for these nodes, they return themselves.
    if node_id in {NodeId.broadcast, NodeId.host}:
        assert node_id.bootloader_for() == node_id

    # Make sure we have the right values between nodes
    bootloader_node = node_id.bootloader_for()
    assert node_id in NodeId.bootloader_map()[bootloader_node]


@pytest.mark.parametrize("node_id", {n for n in NodeId})
def test_application_for(node_id: NodeId) -> None:
    """Test bootloader node to application node mapping."""
    # bootloaders should produce application nodes
    if node_id.is_bootloader():
        assert node_id.application_for() == NodeId.bootloader_map()[node_id][0]

    # get a flattened list of all the sub-nodes, which are nodes with more
    # than one element in the NodeId.bootloader_map list.
    sub_nodes = sum([n for n in NodeId.bootloader_map().values() if len(n) > 1], [])
    # Make sure that if this is a sub-node that the application node is the first
    # element in the bootloader map list
    if node_id in sub_nodes:
        bootloader = node_id.bootloader_for()
        assert node_id.application_for() == NodeId.bootloader_map()[bootloader][0]
