import os
import sys
import json
from opentrons.robot.robot import Robot
from opentrons.instruments import pipette_config
from opentrons import instruments as inst, containers as cnt
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
    from protocol_api.back_compat import *
else:
    from old_api import *


__all__ = [containers, instruments, labware, robot, reset, __version__]
