from opentrons.broker import subscribe
from opentrons import commands


def my_command(arg1, meta=None, arg2='', arg3=''):
    return {
        'name': 'command',
        'payload': {
            'description': meta.format(arg1=arg1, arg2=arg2, arg3=arg3)
        }
    }


@commands.publish.both(command=my_command, meta='{arg1} {arg2} {arg3}')
def A(arg1, arg2, arg3='foo'):
    B(0)
    return 100


@commands.publish.both(command=my_command, meta='{arg1} {arg2} {arg3}')
def C(arg1, arg2, arg3='bar'):
    B(0)
    return 100


@commands.publish.both(command=my_command, meta='{arg1}')
def B(arg1):
    return None


def test_add_listener():
    stack = []
    calls = []

    def on_notify(message):
        assert message['name'] == 'command'
        payload = message['payload']
        description = payload['description']

        if message['$'] == 'before':
            stack.append(message)
            calls.append({'level': len(stack), 'description': description})
        else:
            stack.pop()

    unsubscribe = subscribe('command', on_notify)

    A(0, 1)
    B(2)
    C(3, 4)

    expected = [
        {'level': 1, 'description': '0 1 foo'},
        {'level': 2, 'description': '0'},
        {'level': 1, 'description': '2'},
        {'level': 1, 'description': '3 4 bar'},
        {'level': 2, 'description': '0'}]

    assert calls == expected

    unsubscribe()
    A(0, 2)

    assert calls == expected, 'No calls expected after unsubscribe()'
