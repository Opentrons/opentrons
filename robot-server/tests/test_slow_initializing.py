# noqa: D100

import asyncio
import typing
import unittest.mock

import pytest

from robot_server import slow_initializing


class _FakeInitializedObject:
    pass


class _FakeException(Exception):
    pass


def _make_mock_exception_logger() -> typing.Callable[[BaseException], None]:
    return unittest.mock.Mock(spec=[])


async def test_progress_and_success() -> None:  # noqa: D103
    finish_making_object = asyncio.Event()

    expected_result = _FakeInitializedObject()

    async def factory() -> _FakeInitializedObject:
        await finish_making_object.wait()
        return expected_result

    exception_logger = _make_mock_exception_logger()

    subject = slow_initializing.start_initializing(
        factory=factory, exception_logger=exception_logger
    )

    # factory() is ongoing (blocked on finish_making_object), so .get_if_ready() should
    # report not ready.
    with pytest.raises(slow_initializing.InitializationOngoingError):
        subject.get_if_ready()

    # Allow factory() to complete and see that its result gets passed on.
    finish_making_object.set()
    assert await subject.get_when_ready() == expected_result
    assert subject.get_if_ready() == expected_result

    typing.cast(unittest.mock.Mock, exception_logger).assert_not_called()


async def test_exception_propagated() -> None:  # noqa: D103
    async def failing_factory() -> _FakeInitializedObject:
        raise _FakeException()

    exception_logger = _make_mock_exception_logger()

    subject = slow_initializing.start_initializing(
        factory=failing_factory, exception_logger=exception_logger
    )

    with pytest.raises(slow_initializing.InitializationFailedError) as exc_info_1:
        await subject.get_when_ready()

    with pytest.raises(slow_initializing.InitializationFailedError) as exc_info_2:
        subject.get_if_ready()

    raised_exception_1 = exc_info_1.value
    original_exception_1 = raised_exception_1.__cause__
    raised_exception_2 = exc_info_2.value
    original_exception_2 = raised_exception_2.__cause__

    assert type(original_exception_1) == _FakeException
    assert original_exception_1 == original_exception_2

    typing.cast(unittest.mock.Mock, exception_logger).assert_called_once_with(
        original_exception_1
    )
