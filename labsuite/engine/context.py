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

from labsuite.labware import deck


class Context():

    def __init__(self):
        self.deck = deck.Deck()

    def execute(self, method, *args, **kwargs):
        """
        Traverses through child components until it finds something that
        has the same method name, then passes the arguments and returns
        the response.

        This essentially provides full machine-level permissions to anyone
        with web console access. Fine for now because this runs on a local
        server hosted on the robot.
        """
        deck_method = getattr(self.deck, method, None)
        if callable(deck_method):
            return deck_method(*args, **kwargs)
        else:
            raise AttributeError("Command not found: " + method)
