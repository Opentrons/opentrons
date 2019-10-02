import os
import sys
import json
HERE = os.path.abspath(os.path.dirname(__file__))
from opentrons import config  # noqa(E402)
from opentrons.data_storage import database_migration  # noqa(E402)

if os.environ.get('OT_UPDATE_SERVER') != 'true'\
   and not config.feature_flags.use_protocol_api_v2():
    database_migration.check_version_and_perform_full_migration()
elif not config.feature_flags.use_protocol_api_v2():
    # Need to minimally build the database for CI
    database_migration.check_version_and_perform_minimal_migrations()


if not config.feature_flags.use_protocol_api_v2():
    from .legacy_api.api import (robot,   # noqa(E402)
                                 reset,
                                 instruments,
                                 containers,
                                 labware,
                                 modules)
    names_list = [
        'containers', 'instruments', 'robot', 'reset', 'modules', 'labware']
else:
    names_list = []

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
