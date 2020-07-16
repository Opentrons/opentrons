class ProtocolException(Exception):
    """Base of all protocol exceptions"""
    pass


class ProtocolNotFoundException(Exception):
    """Protocol name is not found"""
    pass


class ProtocolNameInUseException(Exception):
    """Attempting to create a protocol with name already in use"""
    pass

