"""Tests for a PythonFileRunner interface."""
import pytest

from opentrons.file_runner import PythonFileRunner


@pytest.fixture
def subject() -> PythonFileRunner:
    """Get a PythonFileRunner test subject."""
    return PythonFileRunner()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_play(subject: PythonFileRunner) -> None:
    """It should be able to start the run."""
    subject.play()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_pause(subject: PythonFileRunner) -> None:
    """It should be able to pause the run."""
    subject.pause()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_python_runner_stop(subject: PythonFileRunner) -> None:
    """It should be able to stop the run."""
    subject.stop()
