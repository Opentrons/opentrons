# noqa: D100


import asyncio
import typing

from decoy import Decoy, matchers
import pytest

from robot_server import slow_initializing


class _FakeInitializedObject:
    pass


class _FakeException(Exception):
    pass


async def test_progress_and_success(decoy: Decoy) -> None:  # noqa: D103
    finish_making_object = asyncio.Event()

    expected_result = _FakeInitializedObject()

    async def factory() -> _FakeInitializedObject:
        await finish_making_object.wait()
        return expected_result

    exception_logger = decoy.mock(func=slow_initializing.log)

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

    # exception_logger should not have been called.
    decoy.verify(exception_logger(matchers.Anything()), times=0)


async def test_exception_propagated(decoy: Decoy) -> None:  # noqa: D103
    async def failing_factory() -> _FakeInitializedObject:
        raise _FakeException()

    exception_logger = decoy.mock(func=slow_initializing.log)

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

    # This "is not None" assert is redundant after the type assertion above, but mypy
    # v0.812 seems to need it for this decoy.verify().
    assert original_exception_1 is not None
    decoy.verify(exception_logger(original_exception_1), times=1)
