"""Tests for opentrons.commands.publisher."""
from __future__ import annotations

import pytest
from decoy import Decoy, matchers
from typing import Any, Dict, cast
from opentrons.legacy_broker import LegacyBroker
from opentrons.commands.types import Command as CommandDict, CommandMessage
from opentrons.commands.publisher import CommandPublisher, publish, publish_context


@pytest.fixture
def broker(decoy: Decoy) -> LegacyBroker:
    """Return a mocked out Broker."""
    return decoy.mock(cls=LegacyBroker)


def test_publish_decorator(decoy: Decoy, broker: LegacyBroker) -> None:
    """It should publish "before" and "after" messages for decorated methods."""
    _act = decoy.mock(name="_act")

    def _get_command_payload(foo: str, bar: int) -> CommandDict:
        return cast(
            CommandDict,
            {"name": "some_command", "payload": {"foo": foo, "bar": bar}},
        )

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)
        def act(self, foo: str, bar: int) -> None:
            _act()

    subject = _Subject(broker=broker)
    subject.act("hello", 42)

    before_message_id = matchers.Captor()
    after_message_id = matchers.Captor()

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": before_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        _act(),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": after_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
    )

    assert before_message_id.value == after_message_id.value


def test_publish_decorator_with_arg_defaults(
    decoy: Decoy, broker: LegacyBroker
) -> None:
    """It should pass method argument defaults to the command creator."""
    _act = decoy.mock(name="_act")

    def _get_command_payload(foo: str, bar: int) -> CommandDict:
        return cast(
            CommandDict,
            {"name": "some_command", "payload": {"foo": foo, "bar": bar}},
        )

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)
        def act(self, foo: str, bar: int = 42) -> None:
            _act()

    subject = _Subject(broker=broker)
    subject.act("hello")

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": matchers.IsA(str),
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        _act(),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": matchers.IsA(str),
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
    )


def test_publish_decorator_with_error(decoy: Decoy, broker: LegacyBroker) -> None:
    """It should capture an exception and place it in the "after" message."""

    def _get_command_payload(foo: str, bar: int) -> Dict[str, Any]:
        return {"name": "some_command", "payload": {"foo": foo, "bar": bar}}

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str, bar: int) -> None:
            raise RuntimeError("oh no")

    subject = _Subject(broker=broker)

    with pytest.raises(RuntimeError, match="oh no"):
        subject.act("hello", 42)

    before_message_id = matchers.Captor()
    after_message_id = matchers.Captor()

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": before_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": after_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": matchers.IsA(RuntimeError),
                },
            ),
        ),
    )

    assert before_message_id.value == after_message_id.value


def test_publish_decorator_remaps_instrument(
    decoy: Decoy, broker: LegacyBroker
) -> None:
    """It should pass "self" to command creator arguments named "instrument"."""
    _act = decoy.mock(name="_act")

    def _get_command_payload(foo: str, instrument: _Subject) -> Dict[str, Any]:
        return {
            "name": "some_command",
            "payload": {"foo": foo, "bar": instrument.bar},
        }

    class _Subject(CommandPublisher):
        bar: int = 42

        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str) -> None:
            _act()

    subject = _Subject(broker=broker)

    subject.act("hello")

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": matchers.IsA(str),
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        _act(),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": matchers.IsA(str),
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
    )


def test_publish_context(decoy: Decoy, broker: LegacyBroker) -> None:
    _act = decoy.mock(name="_act")

    command = cast(
        CommandDict,
        {"name": "some_command", "payload": {"foo": "hello", "bar": 42}},
    )

    def _published_func(foo: str, bar: int) -> None:
        _act()

    with publish_context(broker=broker, command=command):
        _published_func("hello", 42)

    before_message_id = matchers.Captor()
    after_message_id = matchers.Captor()

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": before_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        _act(),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": after_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
    )

    assert before_message_id.value == after_message_id.value


def test_publish_context_with_error(decoy: Decoy, broker: LegacyBroker) -> None:
    command = cast(
        CommandDict,
        {"name": "some_command", "payload": {"foo": "hello", "bar": 42}},
    )

    def _published_func(foo: str, bar: int) -> None:
        raise RuntimeError("oh no")

    with pytest.raises(RuntimeError, match="oh no"):
        with publish_context(broker=broker, command=command):
            _published_func("hello", 42)

    before_message_id = matchers.Captor()
    after_message_id = matchers.Captor()

    decoy.verify(
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "before",
                    "id": before_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": None,
                },
            ),
        ),
        broker.publish(
            topic="command",
            message=cast(
                CommandMessage,
                {
                    "$": "after",
                    "id": after_message_id,
                    "name": "some_command",
                    "payload": {"foo": "hello", "bar": 42},
                    "error": matchers.IsA(RuntimeError),
                },
            ),
        ),
    )

    assert before_message_id.value == after_message_id.value
