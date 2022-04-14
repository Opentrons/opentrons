"""OE Updater constants."""

from typing import NamedTuple


class OEPartition(NamedTuple):
    number: int
    path: str
    mount_point: str
