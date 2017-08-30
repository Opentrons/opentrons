from datetime import datetime

VALID_STATES = set(
    ['loaded', 'running', 'error', 'finished', 'stopped', 'paused'])


class Session(object):
    def __init__(self, name, protocol_text):
        self.name = name
        self.commands = None
        self.run_log = []
        self.errors = []
        self.set_state('loaded')
        self.protocol_text = protocol_text

    def set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError('Invalid state: {0}. Valid states are: {1}'
                             .format(state, VALID_STATES))

        self.state = state

    def init_commands(self, commands):
        """
        Given a list of tuples of form (depth, command_text)
        that represents a DFS traversal of a command tree,
        updates self.commands with a dictionary that holds
        a command tree.
        """
        def children(commands, level=0, base_index=0):
            return [
                {
                    'description': command[1],
                    'children': children(commands[index:], level+1, index),
                    'id': base_index+index
                }
                for index, command in enumerate(commands)
                if command[0] == level
            ]

        self.commands = children(commands)

    def log_append(self, command):
        self.run_log.append(
            (len(self.run_log), datetime.utcnow().isoformat(), command))

    def error_append(self, error):
        self.errors.append((datetime.utcnow().isoformat(), error))
