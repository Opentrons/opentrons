"""Tests for opentrons.commands.publisher."""
from __future__ import annotations

import pytest
from decoy import Decoy, matchers
from typing import Any, Dict, AsyncIterator, cast
from opentrons.config import advanced_settings
from opentrons.broker import Broker
from opentrons.commands.types import Command
from opentrons.commands.publisher import CommandPublisher, publish, publish_context


@pytest.fixture
def broker(decoy: Decoy) -> Broker:
    """Return a mocked out Broker."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def engine_is_enabled() -> bool:
    return True


@pytest.fixture
async def enable_protocol_engine(engine_is_enabled: bool) -> AsyncIterator[None]:
    """Temporarily set the enableProtocolEngine feature flag."""
    prev_setting = advanced_settings.get_adv_setting("enableProtocolEngine")
    prev_value = prev_setting.value if prev_setting is not None else False

    await advanced_settings.set_adv_setting("enableProtocolEngine", engine_is_enabled)
    yield
    await advanced_settings.set_adv_setting("enableProtocolEngine", prev_value)


def test_publish_decorator(decoy: Decoy, broker: Broker) -> None:
    """It should publish "before" and "after" messages for decorated methods."""
    _act = decoy.mock()

    def _get_command_payload(foo: str, bar: int) -> Dict[str, Any]:
        return {"name": "some_command", "payload": {"foo": foo, "bar": bar}}

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str, bar: int) -> None:
            _act()

    subject = _Subject(broker=broker)
    subject.act("hello", 42)

    decoy.verify(
        broker.publish(
            topic="command",
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        _act(),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
    )


def test_publish_decorator_with_arg_defaults(decoy: Decoy, broker: Broker) -> None:
    """It should pass method argument defaults to the command creator."""
    _act = decoy.mock()

    def _get_command_payload(foo: str, bar: int) -> Dict[str, Any]:
        return {"name": "some_command", "payload": {"foo": foo, "bar": bar}}

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str, bar: int = 42) -> None:
            _act()

    subject = _Subject(broker=broker)
    subject.act("hello")

    decoy.verify(
        broker.publish(
            topic="command",
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        _act(),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
    )


def test_publish_decorator_with_error(
    decoy: Decoy,
    broker: Broker,
    enable_protocol_engine: None,
) -> None:
    """It should capture an exception and place it in the "after" message."""
    _act = decoy.mock()

    def _get_command_payload(foo: str, bar: int) -> Dict[str, Any]:
        return {"name": "some_command", "payload": {"foo": foo, "bar": bar}}

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str, bar: int) -> None:
            _act()

    decoy.when(_act()).then_raise(RuntimeError("oh no"))

    subject = _Subject(broker=broker)

    with pytest.raises(RuntimeError, match="oh no"):
        subject.act("hello", 42)

    decoy.verify(
        broker.publish(
            topic="command",
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": matchers.IsA(RuntimeError),
            },
        ),
    )


@pytest.mark.parametrize("engine_is_enabled", [False])
def test_publish_decorator_with_error_no_engine(
    decoy: Decoy,
    broker: Broker,
    enable_protocol_engine: None,
) -> None:
    """It should not capture errors if engine FF is off."""
    _act = decoy.mock()

    def _get_command_payload(foo: str, bar: int) -> Dict[str, Any]:
        return {"name": "some_command", "payload": {"foo": foo, "bar": bar}}

    class _Subject(CommandPublisher):
        @publish(command=_get_command_payload)  # type: ignore[arg-type]
        def act(self, foo: str, bar: int) -> None:
            _act()

    decoy.when(_act()).then_raise(RuntimeError("oh no"))

    subject = _Subject(broker=broker)

    with pytest.raises(RuntimeError, match="oh no"):
        subject.act("hello", 42)

    decoy.verify(
        broker.publish(topic="command", message=matchers.DictMatching({"$": "after"})),
        times=0,
    )


def test_publish_decorator_remaps_instrument(decoy: Decoy, broker: Broker) -> None:
    """It should pass "self" to command creator arguments named "instrument"."""
    _act = decoy.mock()

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
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        _act(),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
    )


def test_publish_context(decoy: Decoy, broker: Broker) -> None:
    _act = decoy.mock()

    command = cast(
        Command,
        {"name": "some_command", "payload": {"foo": "hello", "bar": 42}},
    )

    def _published_func(foo: str, bar: int) -> None:
        _act()

    with publish_context(broker=broker, command=command):
        _published_func("hello", 42)

    decoy.verify(
        broker.publish(
            topic="command",
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        _act(),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
    )


def test_publish_context_with_error(
    decoy: Decoy,
    broker: Broker,
    enable_protocol_engine: None,
) -> None:
    command = cast(
        Command,
        {"name": "some_command", "payload": {"foo": "hello", "bar": 42}},
    )

    def _published_func(foo: str, bar: int) -> None:
        raise RuntimeError("oh no")

    with pytest.raises(RuntimeError, match="oh no"):
        with publish_context(broker=broker, command=command):
            _published_func("hello", 42)

    decoy.verify(
        broker.publish(
            topic="command",
            message={
                "$": "before",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": None,
            },
        ),
        broker.publish(
            topic="command",
            message={
                "$": "after",
                "name": "some_command",
                "payload": {"foo": "hello", "bar": 42},
                "error": matchers.IsA(RuntimeError),
            },
        ),
    )


@pytest.mark.parametrize("engine_is_enabled", [False])
def test_publish_context_with_error_no_engine(
    decoy: Decoy,
    broker: Broker,
    enable_protocol_engine: None,
) -> None:
    """It should not capture errors if the engine FF is off."""
    command = cast(
        Command,
        {"name": "some_command", "payload": {"foo": "hello", "bar": 42}},
    )

    def _published_func(foo: str, bar: int) -> None:
        raise RuntimeError("oh no")

    with pytest.raises(RuntimeError, match="oh no"):
        with publish_context(broker=broker, command=command):
            _published_func("hello", 42)

    decoy.verify(
        broker.publish(topic="command", message=matchers.DictMatching({"$": "after"})),
        times=0,
    )
