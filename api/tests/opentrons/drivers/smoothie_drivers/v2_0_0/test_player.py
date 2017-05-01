import unittest
import time

from opentrons import drivers
from opentrons.drivers.smoothie_drivers.v2_0_0 import player


class OpenTronsTest(unittest.TestCase):

    def setUp(self):
        self.physical_smoothie = drivers.get_serial_driver(
            drivers.get_serial_ports_list()[0])
        self.virtual_smoothie = drivers.get_virtual_driver({})
        self.player = player.SmoothiePlayer_2_0_0()

    def tearDown(self):
        self.virtual_smoothie.disconnect()

    def test_record_movements(self):
        self.physical_smoothie.home('xyzab')
        self.virtual_smoothie.record_start(self.player)
        for i in range(10):
            self.virtual_smoothie.move(x=200)
            self.virtual_smoothie.move(x=0)
        self.virtual_smoothie.record_stop()

        self.physical_smoothie.play(self.player)
        res = self.player.progress()
        assert res.get('file')

        self.player.pause()
        res = self.player.progress()
        assert res.get('paused')

        self.player.resume()
        res = self.player.progress()
        assert not res.get('paused')

        self.player.abort()
        res = self.player.progress()
        assert not res.get('file')
