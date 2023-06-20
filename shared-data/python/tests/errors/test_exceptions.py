"""Test exception handling."""
from opentrons_shared_data.errors.exceptions import PythonException


def test_exception_wrapping_single_level() -> None:
    """When we make a PythonException it should capture details of an exception."""
    try:
        raise RuntimeError("oh no!")
    except RuntimeError as e:
        captured_exc = e

    wrapped = PythonException(captured_exc)
    assert wrapped.detail["class"] == "RuntimeError"
    assert wrapped.detail["traceback"]
    assert wrapped.detail["args"] == "('oh no!',)"


def test_exception_wrapping_multi_level() -> None:
    """We can wrap all exceptions in a raise-from chain."""

    def _raise_inner() -> None:
        raise KeyError("oh no!")

    try:
        try:
            _raise_inner()
        except KeyError as e:
            raise RuntimeError("uh oh!") from e
    except RuntimeError as e:
        captured_exc = e

    wrapped = PythonException(captured_exc)
    assert wrapped.detail["class"] == "RuntimeError"
    assert wrapped.detail["traceback"]
    assert wrapped.detail["args"] == "('uh oh!',)"
    second = wrapped.wrapping[0]
    assert isinstance(second, PythonException)
    assert second.detail["class"] == "KeyError"
    assert second.detail["args"] == "('oh no!',)"
    assert not second.wrapping


def test_exception_wrapping_rethrow() -> None:
    """We can wrap raise-froms."""
    try:
        try:
            raise RuntimeError("oh no!")
        except RuntimeError as e:
            raise PythonException(e) from e
    except PythonException as pe:
        wrapped = pe

    assert wrapped.detail["class"] == "RuntimeError"
    assert wrapped.detail["traceback"]
    assert wrapped.detail["args"] == "('oh no!',)"


def test_exception_wrapping_error_in_except() -> None:
    """We can even wrap exceptions in exception handlers."""
    try:
        try:
            raise RuntimeError("oh no!")
        except RuntimeError:
            raise KeyError("uh oh")
    except BaseException as e:
        wrapped = PythonException(e)

    # when we have an exception-during-handler, the originally-handled
    # exception is what's bubbled up:
    assert wrapped.detail["class"] == "KeyError"
    assert len(wrapped.wrapping) == 1
    assert wrapped.wrapping[0].detail["class"] == "RuntimeError"
    assert wrapped.wrapping[0].detail["traceback"]
    assert wrapped.wrapping[0].detail["args"] == "('oh no!',)"
