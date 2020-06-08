"""
opentrons_shared_data: a python package wrapping json config definitions
for the opentrons stack

This package should never be installed on its own, only as a dependency of
the main opentrons package
"""

import os
import json

from .load import get_shared_data_root, load_shared_data

HERE = os.path.abspath(os.path.dirname(__file__))

try:
    with open(os.path.join(HERE, 'package.json')) as pkg:
        package_json = json.load(pkg)
        __version__ = package_json.get('version')
except (FileNotFoundError, OSError):
    __version__ = 'unknown'


__all__ = ['__version__', 'get_shared_data_root', 'load_shared_data']
