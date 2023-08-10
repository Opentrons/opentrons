import asyncio

import pytest

from opentrons.util import async_helpers as subject


class TestAsyncContextManagerInThread:
    """Tests for `async_context_manager_in_thread()`."""

    @staticmethod
    def test_enters_and_exits() -> None:
        """It should enter and exit the given context manager appropriately, and return its result."""

        class ContextManager:
            def __init__(self) -> None:
                self.entered = False
                self.exited = False

            async def __aenter__(self) -> str:
                self.entered = True
                return "Yay!"

            async def __aexit__(
                self, exc_type: object, exc_val: object, exc_tb: object
            ) -> None:
                self.exited = True

        context_manager = ContextManager()

        assert not context_manager.entered
        assert not context_manager.exited

        with subject.async_context_manager_in_thread(context_manager) as (result, _):
            assert context_manager.entered
            assert not context_manager.exited
            assert result == "Yay!"

        assert context_manager.exited

    @staticmethod
    def test_returns_matching_loop() -> None:
        """It should return the event loop that the given context manager is running in."""

        class ContextManager:
            async def __aenter__(self) -> asyncio.AbstractEventLoop:
                return asyncio.get_running_loop()

            async def __aexit__(
                self, exc_type: object, exc_val: object, exc_tb: object
            ) -> None:
                pass

        context_manager = ContextManager()
        with subject.async_context_manager_in_thread(context_manager) as (
            result,
            loop_in_thread,
        ):
            assert result is loop_in_thread

    @staticmethod
    def test_loop_lifetime() -> None:
        """Test the lifetime of the returned event loop.

        While the context manager is open, the event loop should be running and usable.
        After the context manager closes, the event loop should be closed and unusable.
        """

        class NoOp:
            async def __aenter__(self) -> None:
                return None

            async def __aexit__(
                self, exc_type: object, exc_val: object, exc_tb: object
            ) -> None:
                pass

        with subject.async_context_manager_in_thread(NoOp()) as (_, loop_in_thread):
            # As a smoke test to see if the event loop is running and usable,
            # run an arbitrary coroutine and wait for it to finish.
            (
                asyncio.run_coroutine_threadsafe(
                    asyncio.sleep(0.000001), loop_in_thread
                )
            ).result()

        # The loop should be closed and unusable now that the context manager has exited.
        assert loop_in_thread.is_closed
        with pytest.raises(RuntimeError, match="Event loop is closed"):
            loop_in_thread.call_soon_threadsafe(lambda: None)

    @staticmethod
    def test_propagates_exception_from_enter() -> None:
        """If the given context manager raises an exception when it's entered, it should propagate."""

        class RaiseExceptionOnEnter:
            async def __aenter__(self) -> None:
                raise RuntimeError("Oh the humanity.")

            async def __aexit__(
                self, exc_type: object, exc_val: object, exc_tb: object
            ) -> None:
                assert False, "We should not reach here."

        context_manager = RaiseExceptionOnEnter()
        with pytest.raises(RuntimeError, match="Oh the humanity"):
            with subject.async_context_manager_in_thread(context_manager):
                assert False, "We should not reach here."

    @staticmethod
    def test_propagates_exception_from_exit() -> None:
        """If the given context manager raises an exception when it's exited, it should propagate."""

        class RaiseExceptionOnExit:
            async def __aenter__(self) -> None:
                return None

            async def __aexit__(
                self, exc_type: object, exc_val: object, exc_tb: object
            ) -> None:
                raise RuntimeError("Oh the humanity.")

        context_manager = RaiseExceptionOnExit()
        with pytest.raises(RuntimeError, match="Oh the humanity"):
            with subject.async_context_manager_in_thread(context_manager):
                pass
