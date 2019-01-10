from opentrons.broker import subscribe, Notifications
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import adapters
from .session import SessionManager, Session
from .calibration import CalibrationManager


class MainRouter:
    def __init__(self, hardware=None, loop=None):
        self._notifications = Notifications(loop=loop)
        self._unsubscribe = []
        self._unsubscribe += [subscribe(
            Session.TOPIC,
            self._notifications.on_notify)]
        self._unsubscribe += [subscribe(
            CalibrationManager.TOPIC,
            self._notifications.on_notify)]
        if hardware and ff.use_protocol_api_v2():
            hardware = adapters.SynchronousAdapter(hardware)
        self.session_manager = SessionManager(hardware=hardware, loop=loop)
        self.calibration_manager = CalibrationManager(hardware=hardware,
                                                      loop=loop)

    @property
    def notifications(self):
        return self._notifications

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        for unsubscribe in self._unsubscribe:
            unsubscribe()
