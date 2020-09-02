from robot_server.service.errors import RobotServerError, CommonErrorDef


class SystemException(RobotServerError):
    """Base of all system exceptions"""
    pass


class SystemTimeAlreadySynchronized(SystemException):
    """
    Cannot update system time because it is already being synchronized
    via NTP or local RTC.
    """
    def __init__(self, msg: str):
        super().__init__(definition=CommonErrorDef.ACTION_FORBIDDEN,
                         reason=msg)


class SystemSetTimeException(SystemException):
    """Server process Failure"""
    def __init__(self, msg: str):
        super().__init__(definition=CommonErrorDef.INTERNAL_SERVER_ERROR,
                         error=msg)
