import logging
from opentrons import robot

log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self):
        self._globals = {'robot': robot}
        self._locals = {}

    def load_protocol(self, text):
        robot.reset()
        exec(text, self._globals, self._locals)
        return self._globals['robot']

    def load_protocol_file(self, file):
        text = ''
        with open(file) as file:
            text = ''.join(list(file))
        return self.load_protocol(text)
