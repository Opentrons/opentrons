from typing import Union
from opentrons.broker import Notifications, Broker
from .session import SessionManager, Session
from .dev_types import Message as SessionMessage
from .calibration import (CalibrationManager, Message as CalibrationMessage)


class MainRouter:
    def __init__(self, hardware=None, loop=None, lock=None):
        topics = [Session.TOPIC, CalibrationManager.TOPIC]
        self._broker = Broker()
        self._notifications: Notifications[
            Union[SessionMessage, CalibrationMessage]] = Notifications(
                topics, self._broker, loop=loop)

        checked_hw = None
        if hardware:
            checked_hw = hardware.sync
        self.session_manager = SessionManager(
            hardware=checked_hw,
            loop=loop,
            broker=self._broker,
            lock=lock)
        self.calibration_manager = CalibrationManager(hardware=checked_hw,
                                                      loop=loop,
                                                      broker=self._broker,
                                                      lock=lock)

    @property
    def notifications(self):
        return self._notifications

    @property
    def broker(self):
        return self._broker
