import os
import logging

log = logging.getLogger(__name__)


def setup_rules_file():
    """
    Copy the udev rules file for Opentrons Modules to opentrons_data directory
    and trigger the new rules.
    This rules file in opentrons_data is symlinked into udev rules directory

    TODO: Move this file to resources and move the symlink to point to
    /data/system/
    """
    import shutil
    import subprocess

    rules_file = os.path.join(
        os.path.abspath(os.path.dirname(__file__)), '..',
        'config', 'modules', '95-opentrons-modules.rules')

    shutil.copy2(
        rules_file,
        '/data/user_storage/opentrons_data/95-opentrons-modules.rules')

    res0 = subprocess.run('udevadm control --reload-rules',
                          shell=True, stdout=subprocess.PIPE).stdout.decode()
    if res0:
        log.warning(res0.strip())

    res1 = subprocess.run('udevadm trigger',
                          shell=True, stdout=subprocess.PIPE).stdout.decode()
    if res1:
        log.warning(res1.strip())
