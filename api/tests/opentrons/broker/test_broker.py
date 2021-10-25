from opentrons.commands.publisher import CommandPublisher, publish


def my_command(arg1, arg2="", arg3=""):
    return {
        "name": "command",
        "payload": {"description": f"arg1:{arg1}, arg2:{arg2}, arg3:{arg3}"},
    }


class FakeClass(CommandPublisher):
    def __init__(self):
        super().__init__(None)

    @publish(command=my_command)
    def A(self, arg1, arg2, arg3="foo"):
        self.B(0)
        return 100

    @publish(command=my_command)
    def C(self, arg1, arg2, arg3="bar"):
        self.B(0)
        return 100

    @publish(command=my_command)
    def B(self, arg1):
        return None


def test_add_listener():
    stack = []
    calls = []
    fake_obj = FakeClass()

    def on_notify(message):
        assert message["name"] == "command"
        payload = message["payload"]
        description = payload["description"]

        if message["$"] == "before":
            stack.append(message)
            calls.append({"level": len(stack), "description": description})
        else:
            stack.pop()

    unsubscribe = fake_obj.broker.subscribe("command", on_notify)

    fake_obj.A(0, 1)
    fake_obj.B(2)
    fake_obj.C(3, 4)

    expected = [
        {"level": 1, "description": "arg1:0, arg2:1, arg3:foo"},
        {"level": 2, "description": "arg1:0, arg2:, arg3:"},
        {"level": 1, "description": "arg1:2, arg2:, arg3:"},
        {"level": 1, "description": "arg1:3, arg2:4, arg3:bar"},
        {"level": 2, "description": "arg1:0, arg2:, arg3:"},
    ]

    assert calls == expected

    unsubscribe()
    fake_obj.A(0, 2)

    assert calls == expected, "No calls expected after unsubscribe()"
