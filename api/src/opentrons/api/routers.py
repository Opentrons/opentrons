from opentrons.broker import Notifications, Broker
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import adapters
from .session import SessionManager, Session
from .calibration import CalibrationManager


class MainRouter:
    def __init__(self, hardware=None, loop=None,
                 lock=None, allow_own_loop=False):
        topics = [Session.TOPIC, CalibrationManager.TOPIC]
        self._broker = Broker()
        self._notifications = Notifications(topics, self._broker, loop=loop)

        if hardware and ff.use_protocol_api_v2():
            sa_loop = None if allow_own_loop else loop
            hardware = adapters.SynchronousAdapter(
                hardware, sa_loop, own_loop=allow_own_loop)
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
