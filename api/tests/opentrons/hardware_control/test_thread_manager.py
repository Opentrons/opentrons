import pytest
from opentrons.hardware_control.thread_manager import ThreadManagerException,\
    ThreadManager


def test_build_fail_raises_exception():
    """
    Test that a builder that raises an exception raises
    a ThreadManagerException
    """
    def f():
        raise Exception()
    with pytest.raises(ThreadManagerException):
        ThreadManager(f)
