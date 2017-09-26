from .session import SessionManager
from .calibration import CalibrationManager


class Shell:
    def __init__(self, loop=None):
        session_manager = SessionManager(loop=loop)
        calibration_manager = CalibrationManager(loop=loop)
