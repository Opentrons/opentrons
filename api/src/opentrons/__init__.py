import importlib
import json
import os
import sys

version = sys.version_info[0:2]
if version < (3, 7):
    raise RuntimeError(
        'opentrons requires Python 3.7 or above, this is {0}.{1}'.format(
            version[0], version[1]))

HERE = os.path.abspath(os.path.dirname(__file__))

try:
    with open(os.path.join(HERE, 'package.json')) as pkg:
        package_json = json.load(pkg)
        __version__ = package_json.get('version')
except (FileNotFoundError, OSError):
    __version__ = 'unknown'

from opentrons import config  # noqa(E402)

LEGACY_MODULES = [
    'robot', 'reset', 'instruments', 'containers', 'labware', 'modules']

__all__ = ['version', 'HERE', 'LEGACY_MODULES', 'config']


def __getattr__(attrname):
    """
    Lazily load the robot singleton and friends to make importing faster

    The first time somebody does opentrons.robot (or any other v1 "module"
    that is actually a singleton), this will fire because the attr doesn't
    exist, and we'll import and initialize all the singletons. Subsequently
    this function won't be invoked.
    """
    if attrname in LEGACY_MODULES:
        legacy_api = importlib.import_module(
            '.'.join([__name__,
                      'legacy_api',
                      'api']))
        for mod in LEGACY_MODULES:
            setattr(sys.modules[__name__], attrname,
                    getattr(legacy_api, attrname))
        return getattr(sys.modules[__name__], attrname)
    raise AttributeError(attrname)


def __dir__():
    return sorted(__all__ + LEGACY_MODULES)
