import json
import unittest

import dill

from opentrons import containers
from opentrons import instruments
from opentrons.robot import Robot


class JupyterUploadTestCase(unittest.TestCase):
    def setUp(self):
        from main import app
        self.app = app.test_client()
        self.robot = self.get_configured_robot()
        self.robot_as_bytes = dill.dumps(self.robot)

    def get_configured_robot(self):
        Robot.get_instance().reset_for_tests()
        robot = Robot.get_instance()
        plate = containers.load('96-flat', 'B2', 'test-plate')
        tiprack = containers.load('tiprack-200ul', 'A1', 'test-tiprack')
        trash = containers.load('point', 'A2', 'test-trash')

        p1000 = instruments.Pipette(
            name="p1000",
            trash_container=trash,
            tip_racks=[tiprack],
            min_volume=10,
            max_volume=1000,
            axis="b",
        )

        for well in plate[:10]:
            p1000.aspirate(well).delay(1).dispense(next(well))

        return robot

    def test_upload_and_run(self):
        response = self.app.post(
            '/upload-jupyter',
            data=self.robot_as_bytes,
            headers={'Content-Type': 'application/octet-stream'}
        )

        status = json.loads(response.data.decode())['status']
        self.assertEqual(status, 'success')
