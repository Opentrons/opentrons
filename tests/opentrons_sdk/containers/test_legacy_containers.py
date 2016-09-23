import unittest

from opentrons_sdk.containers.container import (
    Container,
    Well,
    Deck,
    Slot
)
from opentrons_sdk.containers.legacy_containers import get_legacy_container


class ContainerTestCase(unittest.TestCase):
    def test_load_legacy_container(self):
        plate = get_legacy_container("24-plate")
        self.assertIsInstance(plate, Container)