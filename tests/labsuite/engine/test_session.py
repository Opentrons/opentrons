import unittest
from labsuite.engine.session import Session
from labsuite.engine import session

class CommandTest(unittest.TestCase):

	def test_session_separation(self):
		""" Different session IDs run in separate contexts. """
		
		# Create two different sessions.
		sess1 = session.connect('client1')
		sess2 = session.connect('client2')

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

	def test_clear_session(self):
		""" Clear sessions after close. """
		start = len(session._sessions.keys())
		sess = session.connect('client3')
		self.assertEqual(len(session._sessions.keys()), start+1)
		sess.close()
		self.assertEqual(len(session._sessions.keys()), start)

	def test_session_with(self):
		start = len(session._sessions.keys())
		with Session('foo') as sess:
			self.assertEqual(len(session._sessions.keys()), start+1)
		self.assertEqual(len(session._sessions.keys()), start)