"""
The command module allows for commands to be defined, parsed, and then
delegated to function calls within the operating context.
"""

import re

_argument_list = {}
_command_list = {}


def _flush_context():
    """
    One of those fun methods that will break everything if you use it
    outside of a testing context.
    """
    global _argument_list
    global _command_list
    _argument_list = {}
    _command_list = {}


class CommandHandler():

    _syntax = ''  # The human-readable syntax string.
    _handler = None  # The function designed to handle those arguments.

    _syntax_pattern = None  # Regular expression based on the syntax string.

    def __init__(self, syntax, handler):
        self._syntax = syntax
        self._handler = handler
        self._syntax_pattern = generate_expression(syntax)

    def parse(self, string):
        """
        Takes a command string and parses it based on the rules stated by
        defined commands.

        Returns a list of arguments or None if there's no match.
        """
        p = self._syntax_pattern
        return [m.groupdict() for m in p.finditer(string)][0]

    def execute(self, string):
        args = self.parse(string)
        return self._handler(**args)


def define_command(command, syntax, handler):
    handler = CommandHandler(syntax, handler)
    _command_list[command] = handler


def define_argument(name, pattern, description):
    """
    Adds a pattern to the recognized arguments list, so that it can be
    referenced in syntax strings.
    """
    _argument_list[name] = pattern


def syntax(syntax, name=None):
    """
    Decorator syntax for define_command. The name of the method becomes the
    command name, unless you pass an optional name parameter.

    The function gets returned unadulterated.
    """

    # Is there a better way to do decorators with arguments?
    def inner(fun):
        define_command(name or fun.__name__, syntax, fun)
        return fun

    return inner


def generate_expression(syntax):
    pattern = syntax
    tags = re.findall(r'(<([^>]*)>)', syntax)
    for m in tags:
        match, tag_name = m
        # Support for named tags.
        if ':' in tag_name:
            tag_name, arg_name = tag_name.split(':')
        else:
            arg_name = tag_name
        tag_pattern = _argument_list.get(tag_name)
        if not tag_pattern:
            raise KeyError(
                tag_name + ' ' +
                "is not a valid tag name. Please use define_argument to " +
                "define each argument before using it as a syntax tag."
            )
        replace = '(?P<{}>{})'.format(arg_name, tag_pattern)
        pattern = re.sub(match, replace, pattern)
    return re.compile(pattern)


def execute(command_string):
    command, args = command_string.split(' ', 1)
    handler = _command_list.get(command)
    if not handler:
        raise KeyError("Command not found: " + command)
    return handler.execute(args)
