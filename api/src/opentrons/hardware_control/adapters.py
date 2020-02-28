""" Adapters for the :py:class:`.hardware_control.API` instances.
"""
import asyncio
import functools
from typing import Any, TYPE_CHECKING

from .types import HardwareAPILike

if TYPE_CHECKING:
    from .dev_types import HasLoop # noqa (F501)


# TODO: BC 2020-02-25 instead of overwriting __get_attribute__ in this class
# use inspect.getmembers to iterate over appropriate members of adapted
# instance and setattr on the outer instance with the proper async resolution
# logic injected. This approach avoids requiring calls to
# object.__get_attribute__(self,...) to opt out of the overwritten
# functionality. It is more readable and protected from
# unintentional recursion.
class SynchronousAdapter(HardwareAPILike):
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    synchronous.

    This class expects to wrap an asynchronous object running in its own thread
    and event loop (obj._loop). Attempting to instantiate a SynchronousAdapter
    in the main thread within it's event loop will hang unless the adapted
    async object is running on its own thread and contained loop.
    In these Cases, it is often helpful to instantiate the API via the
    :py:class:`opentrons.hardware_control.ThreadManager` to ensure that
    all API coroutines are resolved in a thread/loop other than the
    main thread/loop.

    Example
    -------
    .. code-block::
    >>> import opentrons.hardware_control as hc
    >>> import opentrons.hardware_control.adapters as adapts
    >>> api = hc.API.build_hardware_simulator()
    >>> sync_api = adapts.SynchronousAdapter(api)
    >>> sync_api.home()
    """

    def __init__(self, asynchronous_instance: 'HasLoop') -> None:
        """ Build the SynchronousAdapter.

        :param asynchronous_instance: The asynchronous class instance to wrap
        """
        self._obj_to_adapt = asynchronous_instance

    def __repr__(self):
        return '<SynchronousAdapter>'

    @staticmethod
    def call_coroutine_sync(loop, to_call, *args, **kwargs):
        fut = asyncio.run_coroutine_threadsafe(to_call(*args, **kwargs), loop)
        return fut.result()

    def __getattribute__(self, attr_name):
        """ Retrieve attributes from our API and wrap coroutines """
        # Almost every attribute retrieved from us will be for people actually
        # looking for an attribute of the hardware API, so check there first.
        obj_to_adapt = object.__getattribute__(self, '_obj_to_adapt')
        try:
            inner_attr = getattr(obj_to_adapt, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        check = inner_attr
        if isinstance(inner_attr, functools.partial):
            # if partial func check passed in func
            check = inner_attr.func
        try:
            # if decorated func check wrapped func
            check = check.__wrapped__
        except AttributeError:
            pass
        if asyncio.iscoroutinefunction(check):
            # Return a synchronized version of the coroutine
            return functools.partial(
                    object.__getattribute__(self, 'call_coroutine_sync'),
                    obj_to_adapt._loop, inner_attr)
        elif asyncio.iscoroutine(check):
            # Catch awaitable properties and reify the future before returning
            fut = asyncio.run_coroutine_threadsafe(check, obj_to_adapt._loop)
            return fut.result()

        return inner_attr
