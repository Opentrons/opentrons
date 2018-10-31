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
    import opentrons.hardware_control as hardware_control
    try:
        hardware = hardware_control.API.build_hardware_controller()
        """ The global singleton of :py:class:`.hardware_control.API`.

        If this is running on a real robot (and no other Opentrons API server
        is running and connected to the robot's hardware) it will be connected
        to the actual hardware. Otherwise, it will be a simulator.
        """
    except RuntimeError:
        hardware = hardware_control.API.build_hardware_simulator()
    from opentrons.protocol_api.back_compat\
        import robot, reset, instruments, containers, labware, modules
else:
    from .legacy_api.api import (robot,  # type: ignore
                                 reset,  # type: ignore
                                 instruments,  # type: ignore
                                 containers,  # type: ignore
                                 labware,  # type: ignore
                                 modules)  # type: ignore


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset',
           '__version__', 'modules']
