class SessionException(Exception):
    """Base of all session exceptions"""
    pass


class SessionCommandException(SessionException):
    """Base of all command exceptions"""
    pass


class SessionCreationException(SessionException):
    """A session cannot be created"""
    pass


class UnsupportedFeature(SessionException):
    """A feature is not supported"""
    pass


class UnsupportedCommandException(SessionCommandException):
    """A command is not supported by the session"""
    pass


class CommandExecutionException(SessionCommandException):
    """An error occurred during command execution"""
    pass


class CommandExecutionConflict(SessionCommandException):
    """A command cannot execute due to conflict with current state"""
    pass
