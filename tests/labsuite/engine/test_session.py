import unittest
from labsuite.engine.session import Session

class CommandTest(unittest.TestCase):

	def test_session_separation(self):
		""" Different session IDs run in separate contexts. """
		
		# Create two different sessions.
		sess1 = Session('client1')
		sess2 = Session('client2')

		# Give the sessions different data.
		sess1.execute('add_module', 'a1', 'microplate.96')
		sess2.execute('add_module', 'a1', 'microplate.96')
		sess1.execute('calibrate', a1={'x':1, 'y':2, 'z':3})
		sess2.execute('calibrate', a1={'x':4, 'y':5, 'z':6})

		# Check each session for the expected data.
		calibration1 = sess1.execute('dump_calibration')
		expected1 = {'A1': 
			{'calibration': {'primary': {'x': 1, 'y': 2, 'z': 3}},
			'name': 'microplate.96'
		}}
		calibration2 = sess2.execute('dump_calibration')
		expected2 = {'A1': 
			{'calibration': {'primary': {'x': 4, 'y': 5, 'z': 6}},
			'name': 'microplate.96'
		}}
		self.assertEqual(calibration1, expected1)
		self.assertEqual(calibration2, expected2)
