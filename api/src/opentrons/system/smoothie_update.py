""" Functions and variables for the smoothie update process """
import os
import shutil


def _ensure_programmer_executable():
    """ Find the lpc21isp executable and ensure it is executable
    """
    # Find the lpc21isp executable, explicitly allowing the case where it
    # is not executable (since that’s exactly what we’re trying to fix)
    updater_executable = shutil.which('lpc21isp',
                                      mode=os.F_OK)
    assert updater_executable, 'could not find lpc21isp'
    # updater_executable might be None; we’re passing it here unchecked
    # because if it is None, we’re about to fail when we try to program
    # the smoothie, and we want the exception to bubble up.
    os.chmod(updater_executable, 0o777)
