""" opentrons.protocol_api.legacy_wrapper: legacy api iface for protocol api

The functions and modules here implement an API wrapper that looks like the
old robot singleton based api for python protocols, but in fact rely on the
protocol api for behavior.
"""

from .api import *  # noqa(F401)
