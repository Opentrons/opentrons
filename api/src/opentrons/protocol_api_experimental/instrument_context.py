"""Deprecated pipette module for the Python Protocol API.

Previous versions of the Python Protocol API referred to pipettes by
the name "instrument." This module exists to preserve backwards
compatibilty with old import paths.

This module will be removed in Protocol API v4.
"""
from .pipette_context import PipetteContext

InstrumentContext = PipetteContext
"""Alias of PipetteContext to preserve compatibility with Protocol API v2.

.. deprecated:: Protocol API v3.0
    Use :py:class:`PipetteContext` instead.
"""
