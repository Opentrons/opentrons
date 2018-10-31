""" Adapters for the :py:class:`.hardware_control.API` instances.
"""
import asyncio
import functools
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import hardware_control  # noqa(F401): Avoid circular dependency


def sync_call(loop, to_call, *args, **kwargs):
    loop.run_until_complete(to_call(*args, **kwargs))


class SynchronousAdapter:
    """ A wrapper to make every call into :py:class:`.hardware_control.API`
    synchronous.

    Example
    -------
    .. code-block::
    >>> import opentrons.hardware_control as hc
    >>> import opentrons.hardware_control.adapters as adapts
    >>> api = hc.API.build_hardware_simulator()
    >>> synch = adapts.SynchronousAdapter(api)
    >>> synch.home()
    """

    def __init__(self, api: 'hardware_control.API') -> None:
        """ Build the SynchronousAdapter.

        :param api: The API instance to wrap
        """
        self._api = api
        self._loop = self._api._loop

    def __getattribute__(self, attr_name):
        """ Retrieve attributes from our API and wrap coroutines """
        # Almost every attribute retrieved from us will be fore people actually
        # looking for an attribute of the hardware API, so check there first.
        api = object.__getattribute__(self, '_api')
        try:
            attr = getattr(api, attr_name)
        except AttributeError:
            # Maybe this actually was for us? Let’s find it
            return object.__getattribute__(self, attr_name)

        try:
            check = attr.__wrapped__
        except AttributeError:
            check = attr
        if asyncio.iscoroutinefunction(check):
            loop = object.__getattribute__(self, '_loop')
            # Return a synchronized version of the coroutine
            return functools.partial(sync_call, loop, attr)

        return attr
