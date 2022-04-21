"""Tests for Target class."""
import pytest
from _pytest.fixtures import FixtureRequest

from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_update.target import Target


@pytest.fixture(params=list(NodeId))
def system_node_id(request: FixtureRequest) -> NodeId:
    """Each node id fixture."""
    return request.param  # type: ignore[attr-defined,no-any-return]


def test_make_target(system_node_id: NodeId) -> None:
    """It should create the Target."""
    if system_node_id == NodeId.head:
        assert (
            Target(system_node=system_node_id).bootloader_node == NodeId.head_bootloader
        )
    elif system_node_id == NodeId.pipette_left:
        assert (
            Target(system_node=system_node_id).bootloader_node
            == NodeId.pipette_left_bootloader
        )
    elif system_node_id == NodeId.pipette_right:
        assert (
            Target(system_node=system_node_id).bootloader_node
            == NodeId.pipette_right_bootloader
        )
    elif system_node_id == NodeId.gantry_x:
        assert (
            Target(system_node=system_node_id).bootloader_node
            == NodeId.gantry_x_bootloader
        )
    elif system_node_id == NodeId.gantry_y:
        assert (
            Target(system_node=system_node_id).bootloader_node
            == NodeId.gantry_y_bootloader
        )
    elif system_node_id == NodeId.gripper:
        assert (
            Target(system_node=system_node_id).bootloader_node
            == NodeId.gripper_bootloader
        )
    else:
        # Every other node id should raise an exception.
        with pytest.raises(AssertionError):
            Target(system_node=system_node_id)
