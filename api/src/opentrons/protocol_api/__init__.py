""" protocol_api: The user-facing API for OT2 protocols.

This package defines classes and functions for access through a protocol to
control the OT2.

"""
import logging
import os

from . import back_compat
from .contexts import ProtocolContext, InstrumentContext


MODULE_LOG = logging.getLogger(__name__)


def run(protocol_bytes: bytes = None,
        protocol_json: str = None,
        simulate: bool = False,
        context: ProtocolContext = None):
    """ Create a ProtocolRunner instance from one of a variety of protocol
    sources.

    :param protocol_bytes: If the protocol is a Python protocol, pass the
    file contents here.
    :param protocol_json: If the protocol is a json file, pass the contents
    here.
    :param simulate: True to simulate; False to execute. If thsi is not an
    OT2, ``simulate`` will be forced ``True``.
    :param context: The context to use. If ``None``, create a new
    ProtocolContext.
    """
    if not os.environ.get('RUNNING_ON_PI'):
        simulate = True # noqa - will be used later
    if None is context and simulate:
        true_context = ProtocolContext()
    elif context:
        true_context = context
    else:
        raise RuntimeError(
            'Will not automatically generate hardware controller')
    if protocol_bytes:
        back_compat.run(protocol_bytes, true_context)
    elif protocol_json:
        pass


__all__ = ['run', 'ProtocolContext', 'InstrumentContext', 'back_compat']
