"""OE Updater and dependency injection classes."""
from otupdate.common.update_actions import UpdateActionsInterface, Partition


class PartitionManager:
    """Partition manager class."""

    def __init(self):
        pass

    def find_unused_partition(self) -> Partition:
        """Find unused partition"""
        # fw_printenv -n root_part
        fake_partition = Partition(3, "mmcblkp0b2")
        return fake_partition


class RootFSInterface:
    """RootFS interface class."""

    def __init__(self):
        pass

    def write_update(self, unused_partition: Partition):
        pass


class Updater(UpdateActionsInterface):
    """OE updater class."""

    def __init__(self, root_FS_intf: RootFSInterface, part_mngr: PartitionManager):
        self.root_FS_intf = root_FS_intf
        self.part_mngr = part_mngr

    def update(self) -> None:
        unused_partition = self.part_mngr.find_unused_partition()
        self.root_FS_intf.write_update(unused_partition)

    def verify_check_sum(self) -> bool:
        pass
