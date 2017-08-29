import time

VALID_STATES = set(
    ['loaded', 'running', 'error', 'finished', 'stopped', 'paused'])


class Session(object):
    def __init__(self, name):
        self.name = name
        self.commands = None
        self.run_log = []
        self.errors = []
        self.state = 'loaded'

    def set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError('Invalid state: {0}. Valid states are: {1}'
                             .format(state, VALID_STATES))

        self.state = state

    def set_commands(self, commands):
        """
        Expects a list of tuples of form (depth, command_text)
        where depth is depth of the element in command tree.

        The list's item order corresponds to DFS traversal of a command tree.

        Returns a dictionary that reconstructs a command tree.
        """
        def get_children(commands, level=0, base_index=0):
            return [
                {
                    'text': command[1],
                    'children': get_children(commands[index:], level+1, index),
                    'index': base_index+index
                }
                for index, command in enumerate(commands)
                if command[0] == level
            ]

        self.commands = get_children(commands)

    def add_to_log(self, command):
        self.run_log.append((len(self.run_log), time.time(), command))

    def add_error(self, error):
        self.errors.append((time.time(), error))
