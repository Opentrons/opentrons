import os
import unittest

from opentrons.util import environment


class EnvironmentTestCase(unittest.TestCase):

    def test_get_path(self):
        app_data = environment.get_path('APP_DATA_DIR')
        self.assertTrue(os.path.exists(app_data))

        log_file = environment.get_path('LOG_FILE')
        log_path, _ = os.path.split(log_file)
        self.assertTrue(os.path.exists(log_path))

        with self.assertRaisesRegex(
            ValueError,
            'Key "APP_DATA" not found in environment settings'
        ):
            environment.get_path('APP_DATA')

        environment.settings['INVALID_KEY'] = 'invalid path'
        with self.assertRaisesRegex(
            ValueError,
            'Expected key suffix as _DIR or _FILE. "INVALID_KEY" received'
        ):
            environment.get_path('INVALID_KEY')
