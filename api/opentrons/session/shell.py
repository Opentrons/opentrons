from .session import SessionManager
from .calibration import CalibrationManager


class Shell:
    def __init__(self, loop=None):
        self.session_manager = SessionManager(loop=loop)
        self.calibration_manager = CalibrationManager(loop=loop)
