"""Tests for `LegacyBroker`."""

from typing import List, NamedTuple, cast

from opentrons.commands.types import CommandMessage
from opentrons.commands.publisher import CommandPublisher, publish


def _my_command(arg1: int, arg2: str = "", arg3: str = "") -> CommandMessage:
    return cast(
        CommandMessage,
        {
            "name": "command",
            "payload": {"description": f"arg1:{arg1}, arg2:{arg2}, arg3:{arg3}"},
        },
    )


class _Call(NamedTuple):
    level: int
    description: str


class _FakeClass(CommandPublisher):
    def __init__(self) -> None:
        super().__init__(None)

    @publish(command=_my_command)
    def method_a(self, arg1: int, arg2: str, arg3: str = "foo") -> int:
        self.method_b(0)
        return 100

    @publish(command=_my_command)
    def method_b(self, arg1: int) -> None:
        return None

    @publish(command=_my_command)
    def method_c(self, arg1: int, arg2: str, arg3: str = "bar") -> int:
        self.method_b(0)
        return 100


def test_legacy_broker() -> None:
    """Test subscribing, emitting, receiving, and unsubscribing."""
    stack: List[CommandMessage] = []
    calls: List[_Call] = []
    fake_obj = _FakeClass()

    def on_notify(message: CommandMessage) -> None:
        assert message["name"] == "command"  # type: ignore[comparison-overlap]
        payload = message["payload"]
        description = payload["description"]

        if message["$"] == "before":
            stack.append(message)
            calls.append(_Call(level=len(stack), description=description))
        else:
            stack.pop()

    unsubscribe = fake_obj.broker.subscribe("command", on_notify)

    fake_obj.method_a(0, "1")
    fake_obj.method_b(2)
    fake_obj.method_c(3, "4")

    expected = [
        _Call(level=1, description="arg1:0, arg2:1, arg3:foo"),
        _Call(level=2, description="arg1:0, arg2:, arg3:"),
        _Call(level=1, description="arg1:2, arg2:, arg3:"),
        _Call(level=1, description="arg1:3, arg2:4, arg3:bar"),
        _Call(level=2, description="arg1:0, arg2:, arg3:"),
    ]

    assert calls == expected

    unsubscribe()
    fake_obj.method_a(0, "2")

    assert calls == expected, "No calls expected after unsubscribe()"
