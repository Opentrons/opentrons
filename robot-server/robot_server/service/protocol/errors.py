from robot_server.service.errors import RobotServerError, CommonErrorDef


class ProtocolException(RobotServerError):
    """Base of all protocol exceptions"""
    pass


class ProtocolNotFoundException(ProtocolException):
    """Protocol is not found"""
    def __init__(self, identifier: str):
        super().__init__(definition=CommonErrorDef.RESOURCE_NOT_FOUND,
                         resource='protocol',
                         id=identifier)


class ProtocolAlreadyExistsException(ProtocolException):
    """Attempting to overwrite an existing resource"""
    def __init__(self, identifier: str):
        super().__init__(definition=CommonErrorDef.RESOURCE_ALREADY_EXISTS,
                         resource="protocol",
                         id=identifier)


class ProtocolIOException(ProtocolException):
    """IO Failure"""
    def __init__(self, msg: str):
        super().__init__(definition=CommonErrorDef.INTERNAL_SERVER_ERROR,
                         error=msg)


class ProtocolUploadCountLimitReached(ProtocolException):
    """Maximum protocol upload count reached"""
    def __init__(self, msg: str):
        super().__init__(definition=CommonErrorDef.ACTION_FORBIDDEN,
                         reason=msg)
