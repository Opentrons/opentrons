from .session import SessionManager, Session
from .calibration import CalibrationManager
from opentrons.broker import subscribe, Notifications


class MainRouter:
    def __init__(self, loop=None):
        self._notifications = Notifications(loop=loop)
        self.session_manager = SessionManager(loop=loop)
        self.calibration_manager = CalibrationManager(loop=loop)
        self._unsubscribe = subscribe(
            Session.TOPIC,
            self._notifications.on_notify)

    @property
    def notifications(self):
        return self._notifications

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self._unsubscribe()
