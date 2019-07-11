import os
import sys
import json
HERE = os.path.abspath(os.path.dirname(__file__))
from opentrons import config  # noqa(E402)
from opentrons.data_storage import database_migration  # noqa(E402)


if os.environ.get('OT_UPDATE_SERVER') != 'true'\
   and not config.feature_flags.use_protocol_api_v2():
    database_migration.check_version_and_perform_full_migration()
else:
    database_migration.check_version_and_perform_minimal_migrations()


import opentrons.hardware_control.adapters as adapters  # noqa(E402)
from .protocol_api.back_compat import (build_globals as bcbuild,  # noqa(E402)
                                       set_globals,
                                       reset as resetv2)
from .protocol_api.contexts import ProtocolContext  # noqa(E402)
from .legacy_api.api import (robot as robotv1,   # noqa(E402)
                             reset as resetv1,
                             instruments as instrumentsv1,
                             containers as containersv1,
                             labware as labwarev1,
                             modules as modulesv1)


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


def build_globals(version=None, loop=None):
    if version is None:
        checked_version =\
            2 if config.feature_flags.use_protocol_api_v2() else 1
    else:
        checked_version = version
    if checked_version == 1:
        return robotv1, resetv1, instrumentsv1, containersv1,\
            labwarev1, modulesv1, robotv1
    elif checked_version == 2:
        hw = adapters.SingletonAdapter(loop)
        rob, instr, con, lw, mod = bcbuild(hw, loop)
        set_globals(rob, instr, lw, mod)
        return rob, resetv2, instr, lw, lw, mod, hw
    else:
        raise RuntimeError("Bad API version {}; only 1 and 2 are valid"
                           .format(version))


def reset_globals(version=None, loop=None):
    """ Reinitialize the global singletons with a given API version.

    :param version: 1 or 2. If `None`, pulled from the `useProtocolApiV2`
                    advanced setting.
    """
    global containers
    global instruments
    global labware
    global robot
    global reset
    global modules
    global hardware

    robot, reset, instruments, containers, labware, modules, hardware\
        = build_globals(version, loop)


robot, reset, instruments, containers, labware, modules, hardware\
        = build_globals()


__all__ = ['containers', 'instruments', 'labware', 'robot', 'reset',
           '__version__', 'modules', 'hardware', 'HERE']
