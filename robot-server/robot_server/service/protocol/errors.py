from starlette.status import HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND,\
    HTTP_500_INTERNAL_SERVER_ERROR
from robot_server.service.errors import RobotServerError
from robot_server.service.json_api.errors import Error


class ProtocolException(RobotServerError):
    """Base of all protocol exceptions"""
    def __init__(self, status_code, **kwargs):
        super().__init__(status_code=status_code,
                         error=Error(**kwargs))


class ProtocolNotFoundException(ProtocolException):
    """Protocol name is not found"""
    def __init__(self, msg: str):
        super().__init__(status_code=HTTP_404_NOT_FOUND,
                         title="Resource not found",
                         detail=msg)


class ProtocolAlreadyExistsException(ProtocolException):
    """Attempting to overwrite an existing resource"""
    def __init__(self, msg: str):
        super().__init__(status_code=HTTP_403_FORBIDDEN,
                         title="Resource already exists",
                         detail=msg)


class ProtocolIOException(ProtocolException):
    """IO Failure"""
    def __init__(self, msg: str):
        super().__init__(status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                         error=Error(title="IO Error",
                                     detail=msg))


class ProtocolUploadCountLimitReached(RobotServerError):
    """Maximum protocol upload count reached"""
    def __init__(self, msg: str):
        super().__init__(status_code=HTTP_403_FORBIDDEN,
                         error=Error(title="",
                                     detail=msg))
