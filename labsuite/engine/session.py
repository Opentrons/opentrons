"""
Creates a new operational context which binds commands from a particular
client session to a persistent set of objects representing the current
state of a virtual robot.

This state includes deck layout, container calibrations, calculated
liquid levels, tip rack inventories, etc.

The virtual robot dispatches commands to the actual robot using low-level
commands based on calculated absolute coordinates for movements.
"""

from labsuite.engine import Context

_sessions = {}


def connect(sessionID):
    """ Starts a session or reconnects to a previously started session. """
    if sessionID not in _sessions:
        _sessions[sessionID] = Session(sessionID)
    return _sessions[sessionID]


def close(sessionID):
    """ Closes a session based on sessionID. """
    if sessionID in _sessions:
        _sessions[sessionID].close()


class Session():

    _sessionID = None
    _context = None  # Operational context (virtual robot)

    def __init__(self, sessionID):
        """
        Handshake between the server and the client which instantiates a
        virtual robot to keep track of the state of the robot, while
        maintaining connection with one particular client.
        """
        if sessionID in _sessions:
            raise KeyError("Session already exists: "+sessionID)
        _sessions[sessionID] = sessionID
        self._sessionID = sessionID
        self._context = Context()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    @property
    def sessionID(self):
        return self._sessionID

    def execute(self, command, *args, **kwargs):
        """
        Executes and returns the response of a command.
        """
        return self._context.execute(command, *args, **kwargs)

    def close(self):
        """ Closes the session and deletes related session object. """
        del _sessions[self.sessionID]
