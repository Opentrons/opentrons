import unittest
from opentrons_sdk.engine.session import Session
from opentrons_sdk.engine import session


class CommandTest(unittest.TestCase):

    def test_clear_session(self):
        """ Clear sessions after close. """
        start = len(session._sessions.keys())
        sess = session.connect('client3')
        self.assertEqual(len(session._sessions.keys()), start + 1)
        sess.close()
        self.assertEqual(len(session._sessions.keys()), start)

    def test_session_with(self):
        start = len(session._sessions.keys())
        with Session('foo'):
            self.assertEqual(len(session._sessions.keys()), start + 1)
        self.assertEqual(len(session._sessions.keys()), start)
