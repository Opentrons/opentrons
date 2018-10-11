import unittest

from opentrons.legacy_api.robot import Robot
from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.instruments import pipette


class PerformanceTest(unittest.TestCase):
    def setUp(self):
        self.events = []
        self.robot = Robot()

    def protocol(self):
        self.robot.get_serial_ports_list()
        self.robot.home()

        tiprack = containers_load(
            self.robot,
            'tiprack-200ul',  # container type
            'A1',             # slot
            'tiprack'         # user-defined name
        )
        plate = containers_load(
            self.robot,
            '96-flat',
            'B1',
            'plate'
        )
        trash = containers_load(
            self.robot,
            'point',
            'C2',
            'trash'
        )
        trough = containers_load(
            self.robot,
            'trough-12row',
            'B2',
            'trough'
        )

        p200 = pipette.Pipette(
            self.robot,
            name="p200",
            trash_container=trash,
            tip_racks=[tiprack],
            max_volume=200,
            min_volume=0.5,
            axis="b",
            channels=1
        )

        self.robot.clear_commands()

        # distribute
        p200.pick_up_tip(tiprack[0])
        p200.aspirate(96 * 2, trough[0])
        for i in range(96):
            p200.dispense(2, plate[i]).touch_tip()
        p200.drop_tip(tiprack[0])

        p200.pick_up_tip(tiprack[1])
        for i in range(96):
            p200.aspirate(2, plate[95 - i])
        p200.dispense(trough[0])
        p200.drop_tip(tiprack[1])

    def log(self, info):
        self.events.append(info)
