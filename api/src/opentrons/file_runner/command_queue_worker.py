

class CommandQueueWorker:
    """A class that executes the queued commands in a ProtocolEngine."""

    def play(self):
        raise NotImplementedError()

    def pause(self):
        raise NotImplementedError()

    def stop(self):
        raise NotImplementedError()