from opentrons.broker import subscribe, Notifications
from opentrons import robot
from .session import SessionManager, Session
from .calibration import CalibrationManager


class MainRouter:
    def __init__(self, loop=None):
        self._notifications = Notifications(loop=loop)

        # TODO (artyom 20171005): once connect/simulate sequence for the robot
        # is refined, consider moving this elsewhere
        robot.connect()

        self._unsubscribe = []
        self._unsubscribe += [subscribe(
            Session.TOPIC,
            self._notifications.on_notify)]
        self._unsubscribe += [subscribe(
            CalibrationManager.TOPIC,
            self._notifications.on_notify)]

        self.session_manager = SessionManager(loop=loop)
        self.calibration_manager = CalibrationManager(loop=loop)

    @property
    def notifications(self):
        return self._notifications

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        for unsubscribe in self._unsubscribe:
            unsubscribe()
