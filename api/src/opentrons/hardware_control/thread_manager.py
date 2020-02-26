""" Manager for the :py:class:`.hardware_control.API` thread.
"""
import threading
import logging
import asyncio
import functools
from .adapters import SynchronousAdapter
from .types import HardwareAPILike

MODULE_LOG = logging.getLogger(__name__)


# TODO: BC 2020-02-25 instead of overwriting __get_attribute__ in this class
# use inspect.getmembers to iterate over appropriate members of adapted
# instance and setattr on the outer instance with the proper threadsafe
# resolution logic injected. This approach avoids requiring calls to
# object.__get_attribute__(self,...) to opt out of the overwritten
# functionality. It is more readable and protected from
# unintentional recursion.
class ThreadManager(HardwareAPILike):
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    execute within the same thread.

    This class spawns a worker thread and starts an event loop within.
    It then calls the async builder parameter within that worker thread's
    event loop passing thru all args and kwargs and injecting the worker
    thread's loop as a kwarg to the builder. The resulting built object
    is stored as a member of the class, and a synchronous interface to
    the managed object's members is also exposed for convenience.

    Example
    -------
    .. code-block::
    >>> from opentrons.hardware_control import API, ThreadManager
    >>> api_single_thread = ThreadManager(API.build_hardware_simulator)
    >>> await api_single_thread.home() # call as awaitable async
    >>> api_single_thread.sync.home() # call as blocking sync
    """

    def __init__(self, builder, *args, **kwargs) -> None:
        """ Build the ThreadManager.

        :param builder: The API function to use
        """

        self._loop = None
        self.managed_obj = None
        self._sync_managed_obj = None
        is_running = threading.Event()
        self._is_running = is_running
        target = object.__getattribute__(self, '_build_and_start_loop')
        thread = threading.Thread(target=target, name='ManagedThread',
                                  args=(builder, *args), kwargs=kwargs,
                                  daemon=True)
        self._thread = thread
        thread.start()
        is_running.wait()

    def _build_and_start_loop(self, builder, *args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self._loop = loop
        try:
            managed_obj = loop.run_until_complete(builder(*args,
                                                          loop=loop,
                                                          **kwargs))
            self.managed_obj = managed_obj
            self._sync_managed_obj = SynchronousAdapter(managed_obj)
        except Exception:
            MODULE_LOG.exception('Exception in Thread Manager build')
        finally:
            object.__getattribute__(self, '_is_running').set()
            loop.run_forever()
            loop.close()

    @property
    def sync(self):
        return self._sync_managed_obj

    def __repr__(self):
        return '<ThreadManager>'

    def clean_up(self):
        try:
            loop = object.__getattribute__(self, '_loop')
            loop.call_soon_threadsafe(loop.stop)
        except Exception:
            pass
        object.__getattribute__(self, '_thread').join()

    def __del__(self):
        self.clean_up()

    @staticmethod
    async def call_coroutine_threadsafe(loop, coro, *args, **kwargs):
        fut = asyncio.run_coroutine_threadsafe(coro(*args, **kwargs), loop)
        wrapped = asyncio.wrap_future(fut)
        return await wrapped

    def __getattribute__(self, attr_name):
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the managed object, so check there first.
        managed_obj = object.__getattribute__(self, 'managed_obj')
        loop = object.__getattribute__(self, '_loop')
        try:
            attr = getattr(managed_obj, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        if asyncio.iscoroutinefunction(attr):
            # Return coroutine result of async function
            # executed in managed thread to calling thread
            return functools.partial(self.call_coroutine_threadsafe,
                                     loop,
                                     attr)
        elif asyncio.iscoroutine(attr):
            # Return awaitable coroutine properties run in managed thread/loop
            fut = asyncio.run_coroutine_threadsafe(attr, loop)
            wrapped = asyncio.wrap_future(fut, loop=asyncio.get_event_loop())
            return wrapped

        return attr
