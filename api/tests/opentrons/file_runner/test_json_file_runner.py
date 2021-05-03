"""Tests for a JsonFileRunner interface."""
import pytest

from opentrons.file_runner import JsonFileRunner


@pytest.fixture
def subject() -> JsonFileRunner:
    """Get a JsonFileRunner test subject."""
    return JsonFileRunner()


@pytest.mark.xfail(raises=NotImplementedError)
def test_python_runner_load(subject: JsonFileRunner) -> None:
    """It should be able to prepare for run."""
    subject.load()


@pytest.mark.xfail(raises=NotImplementedError)
def test_python_runner_play(subject: JsonFileRunner) -> None:
    """It should be able to start the run."""
    subject.play()


@pytest.mark.xfail(raises=NotImplementedError)
def test_python_runner_pause(subject: JsonFileRunner) -> None:
    """It should be able to pause the run."""
    subject.pause()


@pytest.mark.xfail(raises=NotImplementedError)
def test_python_runner_stop(subject: JsonFileRunner) -> None:
    """It should be able to stop the run."""
    subject.stop()
