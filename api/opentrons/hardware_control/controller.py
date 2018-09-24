import os
import fcntl
import threading

from opentrons.util import environment

_lock = threading.Lock()


class _Locker:
    """ A class that combines a threading.Lock and a file lock to ensure
    controllers are unique both between processes and within a process.

    There should be one instance of this per process.
    """
    LOCK_FILE_PATH = environment.settings['HARDWARE_CONTROLLER_LOCKFILE']

    def __init__(self):
        global _lock

        self._thread_lock_acquired = _lock.acquire(blocking=False)
        self._file_lock_acquired = self._try_acquire_file_lock()
        if not (self._thread_lock_acquired and self._file_lock_acquired):
            raise RuntimeError(
                'Only one hardware controller may be instantiated')

    def _try_acquire_file_lock(self):
        self._file = open(self.LOCK_FILE_PATH, 'w')
        try:
            fcntl.lockf(self._file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            return False
        else:
            return True

    def __del__(self):
        global _lock
        if self._file_lock_acquired:
            fcntl.lockf(self._file, fcntl.LOCK_UN)
        if self._thread_lock_acquired:
            _lock.release()


class Controller:
    """ The concrete instance of the controller for actually controlling
    hardware.

    This class may only be instantiated on a robot, and only one instance
    may be active at any time.
    """

    def __init__(self, config, loop):
        """ Build a Controller instance.

        If another controller is already instantiated on the system (or if
        this is instantiated somewhere other than a robot) then this method
        will raise a RuntimeError.
        """
        if not os.environ.get('RUNNING_ON_PI'):
            raise RuntimeError('{} may only be instantiated on a robot'
                               .format(self.__class__.__name__))
        self._lock = _Locker()
