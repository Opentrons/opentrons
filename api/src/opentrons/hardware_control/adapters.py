""" Adapters for the :py:class:`.hardware_control.API` instances.
"""
import asyncio
import copy
import functools
from typing import List

from . import API
from .types import Axis, HardwareAPILike


def sync_call(loop, to_call, *args, **kwargs):
    return loop.run_until_complete(to_call(*args, **kwargs))


class SynchronousAdapter(HardwareAPILike):
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

    def __init__(self, api: API) -> None:
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


class SingletonAdapter(HardwareAPILike):
    """ A wrapper to use as a global singleton to control hardware.

    This wrapper adds some useful utility functions to defer initialization
    of true hardware controllers (to cut down on work at module import time)
    and in general ease the transition away from the direct use of the old
    robot singleton.

    When the :py:class:`SingletonAdapter` is initialized, it will make a
    hardware simulator instance. When :py:meth:`connect` is called, this
    simulator will be replaced with a new controller that connects to the
    hardware with the specified arguments.

    Attribute accesses are passed on to the embedded
    :py:class:`.hardware_control.API`.
    """

    def __init__(self, loop: asyncio.AbstractEventLoop = None) -> None:
        self._api = API.build_hardware_simulator(loop=loop)

    def __getattr__(self, attr_name):
        return getattr(self._api, attr_name)

    def connect(self, port: str = None, force: bool = False):
        """ Connect to hardware.

        :param port: The port to connect to. May be `None`, in which case the
                     hardware will connect to the first serial port it sees
                     with the device name `FT232R`; or port name compatible
                     with `serial.Serial<https://pythonhosted.org/pyserial/pyserial_api.html#serial.Serial.__init__>`_.  # noqa(E501)
        :param force: If `True`, connect even if a lockfile is established. See
                      :py:meth:`.controller.Controller.__init__`. This should
                      only ever be specified as `True` by the main software
                      starting.
        """
        old_api = object.__getattribute__(self, '_api')
        loop = old_api._loop
        new_api = loop.run_until_complete(API.build_hardware_controller(
            loop=loop,
            port=port,
            config=copy.copy(old_api.config),
            force=force))
        old_api._loop.run_until_complete(new_api.cache_instruments())
        setattr(self, '_api', new_api)

    def disconnect(self):
        """ Disconnect from connected hardware. """
        old_api = object.__getattribute__(self, '_api')
        new_api = API.build_hardware_simulator(
            loop=old_api._loop,
            config=copy.copy(old_api.config))
        setattr(self, '_api', new_api)

    def is_connected(self):
        """ `True` if connected (e.g. has a real controller backing it). """
        api = object.__getattribute__(self, '_api')
        return api.is_simulator

    async def disengage_axes(self, which: List[str]):
        api = object.__getattribute__(self, '_api')
        await api.disengage_axes([Axis[ax.upper()] for ax in which])

    def get_attached_pipettes(self):
        """ Mimic the behavior of robot.get_attached_pipettes"""
        api = object.__getattribute__(self, '_api')
        instrs = {}
        for mount, data in api.attached_instruments.items():
            instrs[mount.name.lower()] = {
                'model': data.get('name', None),
                'id': data.get('pipette_id', None),
                'mount_axis': Axis.by_mount(mount),
                'plunger_axis': Axis.of_plunger(mount)
            }
            if data.get('name'):
                instrs[mount.name.lower()]['tip_length'] \
                    = data.get('tip_length', None)

        return instrs

    def stop(self):
        self._api._loop.run_until_complete(self._api.halt())
