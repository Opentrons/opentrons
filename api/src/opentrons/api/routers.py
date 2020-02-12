from opentrons.broker import Notifications, Broker
from opentrons.hardware_control import adapters
from .session import SessionManager, Session
from .calibration import CalibrationManager


class MainRouter:
    def __init__(self, hardware=None, loop=None, lock=None):
        topics = [Session.TOPIC, CalibrationManager.TOPIC]
        self._broker = Broker()
        self._notifications = Notifications(topics, self._broker, loop=loop)

        if hardware:
            hardware = adapters.SynchronousAdapter(hardware)
        self.session_manager = SessionManager(
            hardware=hardware,
            loop=loop,
            broker=self._broker,
            lock=lock)
        self.calibration_manager = CalibrationManager(hardware=hardware,
                                                      loop=loop,
                                                      broker=self._broker,
                                                      lock=lock)

    @property
    def notifications(self):
        return self._notifications

    @property
    def broker(self):
        return self._broker
