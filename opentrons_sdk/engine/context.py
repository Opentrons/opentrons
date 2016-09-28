"""
Each context instance keeps track of a particular "virtual robot" so that
commands and metadata can be attached and retained for the life of the
instantiated object.

You can think of this as the global interface to the robot, though the
execution queue to the physical robot driver is only one of many possible
output formats.

When the machine reboots, or the session is formally closed, the context
will need to be reinstantiated, and all commands will need to be
reissued.
"""



class Context():

    def __init__(self):
        self.deck = None

    def execute(self, method, *args, **kwargs):
        """
        Traverses through child components until it finds something that
        has the same method name, then passes the arguments and returns
        the response.
        """
        deck_method = getattr(self.deck, method, None)
        if callable(deck_method):
            return deck_method(*args, **kwargs)
        else:
            raise AttributeError("Command not found: " + method)
