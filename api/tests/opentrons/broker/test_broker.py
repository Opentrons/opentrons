from opentrons import commands
from opentrons.commands import CommandPublisher


def my_command(arg1, meta=None, arg2='', arg3=''):
    return {
        'name': 'command',
        'payload': {
            'description': meta.format(arg1=arg1, arg2=arg2, arg3=arg3)
        }
    }


class FakeClass(CommandPublisher):

    def __init__(self):
        super().__init__(None)

    @commands.publish.both(command=my_command, meta='{arg1} {arg2} {arg3}')
    def A(self, arg1, arg2, arg3='foo'):
        self.B(0)
        return 100

    @commands.publish.both(command=my_command, meta='{arg1} {arg2} {arg3}')
    def C(self, arg1, arg2, arg3='bar'):
        self.B(0)
        return 100

    @commands.publish.both(command=my_command, meta='{arg1}')
    def B(self, arg1):
        return None


def test_add_listener():
    stack = []
    calls = []
    fake_obj = FakeClass()

    def on_notify(message):
        assert message['name'] == 'command'
        payload = message['payload']
        description = payload['description']

        if message['$'] == 'before':
            stack.append(message)
            calls.append({'level': len(stack), 'description': description})
        else:
            stack.pop()

    unsubscribe = fake_obj.broker.subscribe('command', on_notify)

    fake_obj.A(0, 1)
    fake_obj.B(2)
    fake_obj.C(3, 4)

    expected = [
        {'level': 1, 'description': '0 1 foo'},
        {'level': 2, 'description': '0'},
        {'level': 1, 'description': '2'},
        {'level': 1, 'description': '3 4 bar'},
        {'level': 2, 'description': '0'}]

    assert calls == expected

    unsubscribe()
    fake_obj.A(0, 2)

    assert calls == expected, 'No calls expected after unsubscribe()'
