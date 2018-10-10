import os
import sys
import json
from opentrons.data_storage import database_migration
from opentrons.config import feature_flags as ff

HERE = os.path.abspath(os.path.dirname(__file__))

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

if not ff.split_labware_definitions():
    database_migration.check_version_and_perform_necessary_migrations()

if ff.use_protocol_api_v2():
    import protocol_api
    from protocol_api.back_compat\
        import robot, reset as bcreset, instruments, containers, labware,\
        modules

    def reset():
        ctx = protocol_api.ProtocolContext()
        bcreset(ctx)

else:
    from .legacy_api.api\
        import robot, reset, instruments, containers, labware, modules


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset',
           '__version__', 'modules']
