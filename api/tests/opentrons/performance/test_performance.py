import unittest
import time

from opentrons import containers
from opentrons import instruments
from opentrons import Robot
from opentrons.helpers.helpers import import_calibration_json

from opentrons.util.trace import EventBroker


class PerformanceTest(unittest.TestCase):
    def setUp(self):
        self.events = []

    def protocol(self):
        robot = Robot.get_instance()
        robot.get_serial_ports_list()
        robot.connect()
        robot.home()

        tiprack = containers.load(
            'tiprack-200ul',  # container type
            'A1',             # slot
            'tiprack'         # user-defined name
        )
        plate = containers.load(
            '96-flat',
            'B1',
            'plate'
        )
        trash = containers.load(
            'point',
            'C2',
            'trash'
        )
        trough = containers.load(
            'trough-12row',
            'B2',
            'trough'
        )

        p200 = instruments.Pipette(
            name="p200",
            trash_container=trash,
            tip_racks=[tiprack],
            max_volume=200,
            min_volume=0.5,
            axis="b",
            channels=1
        )

        calibration_data = """
        {
            "b": {
                "blowout": 28.0,
                "bottom": 26.0,
                "droptip": 32.0,
                "resting": 0,
                "theContainers": {
                    "plate": {
                        "rel_x": 181.696,
                        "rel_y": 0.700999999999965,
                        "rel_z": 9.600999999999999,
                        "x": 202.195,
                        "y": 370.304,
                        "z": 125.7
                    },
                    "tiprack": {
                        "rel_x": 0.0,
                        "rel_y": 0.0,
                        "rel_z": 0.0,
                        "x": 20.499,
                        "y": 369.603,
                        "z": 116.099
                    },
                    "trough": {
                        "rel_x": 0.0,
                        "rel_y": 0.0,
                        "rel_z": 0.0,
                        "x": 20.499,
                        "y": 269.603,
                        "z": 116.099
                    },
                    "trash": {
                        "rel_x": 212.701,
                        "rel_y": -200.801,
                        "rel_z": -58.399,
                        "x": 233.2,
                        "y": 171.305,
                        "z": 57.7
                    }
                },
                "tip_rack_origin": "tiprack",
                "tip_racks": [
                    {
                        "container": "tiprack"
                    }
                ],
                "top": 13.0,
                "trash_container": {
                    "container": "trash"
                },
                "volume": 200
            }
        }
        """

        import_calibration_json(calibration_data, robot, True)

        robot.clear_commands()

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
        # TODO: optimize robot.run()
        # robot.run()

    def log(self, info):
        self.events.append(info)

    def test_performance(self):
        EventBroker.get_instance().add(self.log)
        start = time.process_time()
        self.protocol()
        finish = time.process_time()
        self.assertTrue(finish - start < 1.0)
