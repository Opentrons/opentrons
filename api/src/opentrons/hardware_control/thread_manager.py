"""Manager for the :py:class:`.hardware_control.API` thread."""
import threading
import logging
import asyncio
import functools
import weakref
from typing import (
    Any,
    Awaitable,
    Callable,
    Generic,
    Optional,
    TypeVar,
    cast,
    Sequence,
    Mapping,
)
from .adapters import SynchronousAdapter
from .modules.mod_abc import AbstractModule
from .protocols import (
    AsyncioConfigurable,
)

MODULE_LOG = logging.getLogger(__name__)


class ThreadManagerException(Exception):
    pass


WrappedReturn = TypeVar("WrappedReturn", contravariant=True)
WrappedCoro = TypeVar("WrappedCoro", bound=Callable[..., Awaitable[WrappedReturn]])


async def call_coroutine_threadsafe(
    loop: asyncio.AbstractEventLoop,
    coro: WrappedCoro,
    *args: Sequence[Any],
    **kwargs: Mapping[str, Any],
) -> WrappedReturn:
    fut = cast(
        "asyncio.Future[WrappedReturn]",
        asyncio.run_coroutine_threadsafe(coro(*args, **kwargs), loop),
    )
    wrapped = asyncio.wrap_future(fut)
    return await wrapped


WrappedObj = TypeVar("WrappedObj", bound=AsyncioConfigurable, covariant=True)


class CallBridger(Generic[WrappedObj]):
    def __init__(
        self, wrapped_obj: WrappedObj, loop: asyncio.AbstractEventLoop
    ) -> None:
        self.wrapped_obj = wrapped_obj
        self._loop = loop

    def __getattribute__(self, attr_name: str) -> Any:
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the managed object, so check there first.
        managed_obj = object.__getattribute__(self, "wrapped_obj")
        loop = object.__getattribute__(self, "_loop")
        try:
            attr = getattr(managed_obj, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        if asyncio.iscoroutinefunction(attr):
            # Return coroutine result of async function
            # executed in managed thread to calling thread

            @functools.wraps(attr)
            async def wrapper(
                *args: Sequence[Any], **kwargs: Mapping[str, Any]
            ) -> WrappedReturn:
                return await call_coroutine_threadsafe(loop, attr, *args, **kwargs)

            return wrapper

        elif asyncio.iscoroutine(attr):
            # Return awaitable coroutine properties run in managed thread/loop
            fut = asyncio.run_coroutine_threadsafe(attr, loop)
            wrapped = asyncio.wrap_future(fut)
            return wrapped

        return attr


# TODO: BC 2020-02-25 instead of overwriting __get_attribute__ in this class
# use inspect.getmembers to iterate over appropriate members of adapted
# instance and setattr on the outer instance with the proper threadsafe
# resolution logic injected. This approach avoids requiring calls to
# object.__get_attribute__(self,...) to opt out of the overwritten
# functionality. It is more readable and protected from
# unintentional recursion.
class ThreadManager(Generic[WrappedObj]):
    """A wrapper to make every call into :py:class:`.hardware_control.API`
    execute within the same thread.

    This class spawns a worker thread and starts an event loop within.
    It then calls the async builder parameter within that worker thread's
    event loop passing thru all args and kwargs and injecting the worker
    thread's loop as a kwarg to the builder. The resulting built object
    is stored as a member of the class, and a synchronous interface to
    the managed object's members is also exposed for convenience.

    If you want to wait for the managed object's creation separately
    (with managed_thread_ready_blocking or managed_thread_ready_async)
    then pass threadmanager_nonblocking=True as a kwarg

    Example
    -------
    .. code-block::
    >>> from opentrons.hardware_control import API, ThreadManager
    >>> api_single_thread = ThreadManager(API.build_hardware_simulator)
    >>> await api_single_thread.home() # call as awaitable async
    >>> api_single_thread.sync.home() # call as blocking sync
    """

    def __init__(
        self,
        builder: Callable[..., Awaitable[WrappedObj]],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Build the ThreadManager.

        :param builder: The API function to use
        """

        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self.managed_obj: Optional[WrappedObj] = None
        self.bridged_obj: Optional[CallBridger[WrappedObj]] = None
        self._sync_managed_obj: Optional[SynchronousAdapter[WrappedObj]] = None
        is_running = threading.Event()
        self._is_running = is_running
        self._cached_modules: weakref.WeakKeyDictionary[
            AbstractModule, CallBridger[AbstractModule]
        ] = weakref.WeakKeyDictionary()
        # TODO: remove this if we switch to python 3.8
        # https://docs.python.org/3/library/asyncio-subprocess.html#subprocess-and-threads  # noqa
        # On windows, the event loop and system interface is different and
        # this won't work.
        try:
            asyncio.get_child_watcher()
        except NotImplementedError:
            pass
        blocking = not kwargs.pop("threadmanager_nonblocking", False)
        target = object.__getattribute__(self, "_build_and_start_loop")
        thread = threading.Thread(
            target=target,
            name="ManagedThread",
            args=(builder, *args),
            kwargs=kwargs,
            daemon=True,
        )
        self._thread = thread
        thread.start()
        if blocking:
            object.__getattribute__(self, "managed_thread_ready_blocking")()

    def managed_thread_ready_blocking(self) -> None:
        object.__getattribute__(self, "_is_running").wait()
        if not object.__getattribute__(self, "managed_obj"):
            raise ThreadManagerException("Failed to create Managed Object")

    async def managed_thread_ready_async(self) -> None:
        is_running = object.__getattribute__(self, "_is_running")
        while not is_running.is_set():
            await asyncio.sleep(0.1)
        # Thread initialization is done.
        if not object.__getattribute__(self, "managed_obj"):
            raise ThreadManagerException("Failed to create Managed Object")

    def _build_and_start_loop(
        self,
        builder: Callable[..., Awaitable[WrappedObj]],
        *args: Sequence[Any],
        **kwargs: Mapping[str, Any],
    ) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self._loop = loop
        try:
            managed_obj = loop.run_until_complete(builder(*args, loop=loop, **kwargs))
            self.managed_obj = managed_obj
            self.bridged_obj = CallBridger(managed_obj, loop)
            self._sync_managed_obj = SynchronousAdapter(managed_obj)
        except Exception:
            MODULE_LOG.exception("Exception in Thread Manager build")
        finally:
            object.__getattribute__(self, "_is_running").set()
            loop.run_forever()
            loop.close()

    @property
    def sync(self) -> SynchronousAdapter[WrappedObj]:
        # Why the ignore?
        # While self._sync_managed_obj is initialized None, a failure to build
        # the managed_obj and _sync_managed_obj is a catastrophic failure.
        # All callers of this property assume it to be valid.
        return self._sync_managed_obj  # type: ignore

    def __repr__(self) -> str:
        return "<ThreadManager>"

    def clean_up(self) -> None:
        try:
            loop = object.__getattribute__(self, "_loop")
            loop.call_soon_threadsafe(loop.stop)
        except Exception:
            pass
        object.__setattr__(self, "_cached_modules", weakref.WeakKeyDictionary({}))
        object.__getattribute__(self, "_thread").join()

    def wrap_module(self, module: AbstractModule) -> CallBridger[AbstractModule]:
        """Return the module object wrapped in a CallBridger and cache it.

        The wrapped module objects are cached in `self._cached_modules` so they can be
        re-used throughout the module object's life, as creating a wrapper is expensive.
        We use a WeakKeyDictionary for caching so that module objects can be
        garbage collected when modules are detached (since entries in WeakKeyDictionary
        get discarded when there is no longer a strong reference to the key).
        """
        wrapper_cache = object.__getattribute__(self, "_cached_modules")
        this_module_wrapper = wrapper_cache.get(module)

        if this_module_wrapper is None:
            this_module_wrapper = CallBridger(
                module, object.__getattribute__(self, "_loop")
            )
            wrapper_cache.update({module: this_module_wrapper})

        return this_module_wrapper  # type: ignore

    def __getattribute__(self, attr_name: str) -> Any:
        # hardware_control.api.API.attached_modules is the only hardware
        # API method that returns something other than data. The module
        # objects it returns have associated methods that can be called.
        # That means they need the same wrapping treatment as the API
        # itself.
        if attr_name == "attached_modules":
            wrap = object.__getattribute__(self, "wrap_module")
            managed = object.__getattribute__(self, "managed_obj")
            attr = getattr(managed, attr_name)
            return [wrap(mod) for mod in attr]
        elif attr_name == "clean_up":
            # the wrapped object probably has this attr as well as us, and we
            # want to call both, with the wrapped one first

            # we only want to call cleanup once, and then only if the loop
            # is running
            wrapped_loop = object.__getattribute__(self, "_loop")
            if not wrapped_loop.is_running():
                return lambda: None

            wrapped_cleanup = getattr(
                object.__getattribute__(self, "bridged_obj"), "clean_up"
            )
            our_cleanup = object.__getattribute__(self, "clean_up")

            def call_both() -> None:
                # the wrapped cleanup wants to happen in the managed thread,
                # started from the managed loop. our cleanup wants to happen
                # in the current thread, _after_ the wrapped cleanup is done
                # so cancelled tasks can have a chance to complete.
                async def clean_and_notify() -> None:
                    await wrapped_cleanup()
                    # this sleep allows the wrapped loop to spin a couple
                    # times to clean up the tasks we just cancelled. My kingdom
                    # for an asyncio.spin_once()
                    await asyncio.sleep(0.1)

                fut = asyncio.run_coroutine_threadsafe(clean_and_notify(), wrapped_loop)
                fut.result()
                our_cleanup()

            return call_both

        else:
            try:
                return getattr(object.__getattribute__(self, "bridged_obj"), attr_name)
            except AttributeError:
                return object.__getattribute__(self, attr_name)

    def wrapped(self) -> WrappedObj:
        """Expose the type of the underlying wrapped object.

        This isn't a method that does anything (it just returns self again) but the cast
        means that the type of self will be what the threadmanager's generic wrapped
        object is. You can therefore use this to get typechecking when using
        ThreadManagers.

        While the generic type is what you say it is when you annotate the instance
        variable containing a ThreadManager, if you restrict yourself to annotating
         those instances using a protocol from hardware_api.protocols, things will more
        or less work out through the rest of the system. Not perfect, but ok.
        """
        return cast(WrappedObj, self)
