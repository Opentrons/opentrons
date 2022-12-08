"""A Python package wrapping json config definitions for the Opentrons stack.

This package should never be installed on its own, only as a dependency of
the main opentrons package
"""

import os

from .load import get_shared_data_root, load_shared_data

HERE = os.path.abspath(os.path.dirname(__file__))

from ._version import version  # noqa: E402

__version__ = version

__all__ = ["__version__", "get_shared_data_root", "load_shared_data"]
