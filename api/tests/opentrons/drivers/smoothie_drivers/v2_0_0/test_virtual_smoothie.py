import unittest

from opentrons.drivers import virtual_smoothies_by_version


class VirtualSmoothieTestCase(unittest.TestCase):

    def setUp(self):
        options = {
            'limit_switches': True,
            'firmware': 'edge-1c222d9NOMSD',
            'config': {
                'ot_version': 'one_pro_plus',
                'version': 'v2.0.0',    # config version
                'alpha_steps_per_mm': 80.0,
                'beta_steps_per_mm': 80.0,
                'gamma_steps_per_mm': 400
            }
        }
        self.s = virtual_smoothies_by_version.get('edge-1c222d9NOMSD')(options)
        self.s.open()

    def test_version(self):
        self.s.write('version')
        res = self.s.readline().decode()
        expected = 'Build version: edge-1c222d9NOMSD, '
        expected += 'Build date: Mar 18 2017 21:15:21, '
        expected += 'MCU: LPC1769, System Clock: 120MHz'
        self.assertEqual(res, expected)

    def test_reset(self):
        self.s.write('reset')
        res = self.s.readline()
        self.assertEqual(
            res, b'Smoothie out. Peace. Rebooting in 5 seconds...')

    def test_config_get(self):
        self.s.write('config-get sd ot_version')
        res = self.s.readline()
        self.assertEqual(res, b'sd: ot_version is set to one_pro_plus')

        self.s.reset_input_buffer()

        self.s.write('config-get sd go_crazy')
        res = self.s.readline()
        self.assertEqual(res, b'sd: go_crazy is not in config')

    def test_config_set(self):
        self.s.write('config-set sd ot_version hood')
        res = self.s.readline()
        self.assertEqual(res, b'sd: ot_version has been set to hood')

        self.s.reset_input_buffer()

        self.s.write('config-get sd ot_version')
        res = self.s.readline()
        self.assertEqual(res, b'sd: ot_version is set to hood')

    def test_parse_command(self):
        expected_result = {
            'command': 'G0',
            'arguments': {
                'X': 1.0,
                'Y': 2.5,
                'Z': 3.0,
                'a': 4.0,
                'b': 5.0,
                'F': -66.0
            }
        }

        res = self.s.parse_command('G0X1Y2.5Z3a4b5F-66')
        self.assertDictEqual(res, expected_result)

        res = self.s.parse_command('G0 X1Y2.5Z3a4b5F-66')
        self.assertDictEqual(res, expected_result)

        res = self.s.parse_command('G0X1 Y2.5Z3a4b5F-66')
        self.assertDictEqual(res, expected_result)

    def test_set_position(self):
        self.s.write('G28.3X1Y2.5Z3')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        self.s.write('G28.3')
        self.assertEqual(self.s.readline().decode(), 'ok')
        self.assertEqual(self.s.readline().decode(), 'ok')

    def test_endstops(self):
        self.s.write('M119')
        response = self.s.readline().decode()
        expected_result = 'X_min:0 Y_min:0 Z_min:0 A_min:0 B_min:0 '
        expected_result += 'pins- (XL)P1.24:0 (YL)P1.26:0 (ZL)P1.28:0 '
        expected_result += '(AL)P1.25:0 (BL)P1.27:0'
        self.assertEquals(response, expected_result)
        response = self.s.readline()
        self.assertEqual(response, b'ok')

    def test_calm_down(self):
        self.s.write('M999')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

    def test_dwell(self):
        self.s.write('G4 S1 P200')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

    def test_home(self):
        self.s.write('G0X1Y2.5Z3')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        self.s.write('G28.2X')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        expected_result = 'ok MCS: X:3.0 Y:2.5 Z:3.0 A:0.0 B:0.0'

        self.s.reset_input_buffer()
        self.s.write('M114.2')
        response = self.s.readline().decode()
        self.assertEqual(response[:2], 'ok')

        self.assertEquals(response, expected_result)

        self.s.reset_input_buffer()
        self.s.write('G28.2')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        expected_result = 'ok MCS: X:3.0 Y:3.0 Z:3.0 A:3.0 B:3.0'

        self.s.reset_input_buffer()
        self.s.write('M114.2')
        response = self.s.readline().decode()
        self.assertEqual(response[:2], 'ok')

        self.assertEquals(response, expected_result)

    def test_limit_switch_hit(self):
        self.s.write('G90')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

        self.s.write('G0X-100')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

        response = self.s.readline()
        self.assertEqual(
            response,
            b'Limit switch X_min was hit - reset or M999 required')

    def test_mosfet_state(self):
        for i in range(12):
            self.s.write('M{}'.format(i + 40))
            response = self.s.readline()
            self.assertEqual(response, b'ok')

    def test_power_on_off(self):
        self.s.write('M17')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

        self.s.write('M18')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

    def test_move(self):

        self.s.write('G90')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

        self.s.write('G0X1Y2.5Z3')
        response = self.s.readline()
        self.assertEqual(response, b'ok')

        self.s.reset_input_buffer()
        self.s.write('M114.2')
        response = self.s.readline().decode()
        self.assertEqual(response[:2], 'ok')

        expected_result = 'ok MCS: X:1.0 Y:2.5 Z:3.0 A:0.0 B:0.0'
        self.assertEquals(response, expected_result)

        self.s.reset_input_buffer()
        self.s.write('G91')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        self.s.reset_input_buffer()
        self.s.write('G0X1Y1Z-1')
        response = self.s.readline().decode()
        self.assertEqual(response, 'ok')

        self.s.reset_input_buffer()
        self.s.write('M114.2')
        response = self.s.readline().decode()
        self.assertEqual(response[:2], 'ok')

        expected_result = 'ok MCS: X:2.0 Y:3.5 Z:2.0 A:0.0 B:0.0'
        self.assertEquals(response, expected_result)
