import os
import sys
import json
HERE = os.path.abspath(os.path.dirname(__file__))
from opentrons import config  # noqa(E402)
from opentrons.data_storage import database_migration  # noqa(E402)

if os.environ.get('OT_UPDATE_SERVER') != 'true':
    database_migration.check_version_and_perform_full_migration()


from .legacy_api.api import (robot,   # noqa(E402)
                             reset,
                             instruments,
                             containers,
                             labware,
                             modules)
names_list = [
    'containers', 'instruments', 'robot', 'reset', 'modules', 'labware']

try:
    with open(os.path.join(HERE, 'package.json')) as pkg:
        package_json = json.load(pkg)
        __version__ = package_json.get('version')
except (FileNotFoundError, OSError):
    __version__ = 'unknown'

version = sys.version_info[0:2]
if version < (3, 5):
    raise RuntimeError(
        'opentrons requires Python 3.5 or above, this is {0}.{1}'.format(
            version[0], version[1]))


__all__ = ['__version__', 'HERE'] + names_list
