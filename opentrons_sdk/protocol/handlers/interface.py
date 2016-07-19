class ProtocolHandler():

    """
    Empty interface that all ProtocolHandlers should support.  If a command
    isn't officially supported, it'll just be silently ignored.

    Normalization doesn't happen here. Don't call these classes directly,
    let the Protocol do its work first and run things internally.

    Do not do validation in these handlers. Don't do it.

    Use Protocol.attach to attach a handler.
    """

    _context = None
    _protocol = None  # Don't touch the protocol, generally.

    def __init__(self, protocol, context=None):
        self._context = context
        self._protocol = protocol
        self.setup()

    def setup(self):
        """
        Whatever setup you need to do for your context, do it here.
        """
        pass

    def teardown(self):
        """
        Whatever cleanup you need to do after a protocol is done
        running.
        """
        pass

    def before_each(self):
        pass

    def after_each(self):
        pass

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        pass

    def transfer_group(self, *transfers):
        pass

    def distribute(self):
        pass

    def mix(self):
        pass

    def consolidate(self):
        pass
