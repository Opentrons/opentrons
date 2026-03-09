"""Tests for Target class."""
import pytest

from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_update.target import Target


@pytest.mark.parametrize(
    "system_node_id", [n for n in NodeId if n.application_for() == n]
)
def test_make_target_from_system(system_node_id: NodeId) -> None:
    """It should create the Target from a system id."""
    if system_node_id in (NodeId.broadcast, NodeId.host):
        with pytest.raises(AssertionError):
            Target.from_single_node(system_node_id)
    else:
        this_target = Target(
            system_node=system_node_id, bootloader_node=system_node_id.bootloader_for()
        )
        assert Target.from_single_node(system_node_id) == this_target


@pytest.mark.parametrize(
    "bootloader_node_id",
    [n for n in NodeId if n.is_bootloader()],
)
def test_make_target_from_bootloader(bootloader_node_id: NodeId) -> None:
    """It should create the target from a bootloader."""
    this_target = Target(
        system_node=bootloader_node_id.application_for(),
        bootloader_node=bootloader_node_id,
    )
    assert Target.from_single_node(bootloader_node_id) == this_target
