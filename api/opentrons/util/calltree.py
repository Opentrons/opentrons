import inspect
import sys
import itertools
from collections import namedtuple


def stack(descriptions, message, _id):
    """
    Returns list of function names representing a stack
    filtering out private methods
    """
    stack = []

    # TODO (artyom, 20170907)
    # https://docs.python.org/3/library/sys.html#sys._getframe
    # This is specific to CPyphon.
    # Pypy warns of performance penalty: http://pypy.org/performance.html
    # don't report ourselves in call stack
    frame = sys._getframe().f_back
    while frame:
        function_name = frame.f_code.co_name
        # Filter internal functions which we identify as something
        # that starts with '_' and '<'
        if not function_name.startswith(('_', '<')):
            stack.append(
                {
                    'name': function_name,
                    'description': descriptions.get(function_name, None)
                })
        frame = frame.f_back

    stack[-1]['description'] = message
    stack[-1]['id'] = _id

    return list(reversed(stack))


def tree(stacks):
    def separator(stack):
        stack = list(stack) + [id(stack)]
        return tuple(stack[:2])

    def _description(key):
        return key['description']

    def _id(key):
        return key.get('id', None)

    def _tree(stacks):
        stacks = [stack for stack in stacks if stack]
        return [
            {
                'description': _description(key[0]),
                'children': _tree([stack[1:] for stack in group if group]),
                'id': _id(key[0])
            }
            for key, group in itertools.groupby(
                stacks, separator)
        ]
    return _tree(stacks)
