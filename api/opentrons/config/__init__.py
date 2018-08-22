"""
This module handles configuration management. It keeps track of where the
configuration data is found in the robot, and is able to search for data to
construct an index if an existing index is not found. All other modules that
use persistent configuration data should use this module to read and write it.

Also, each persistent data file should only have one writer. At a minimum, this
module should be the only writer of the index file that keeps track of where
all other data can be found. If another module writes persistent data directly,
it should read the index via this module, update the index, and then write the
updated copy via this module again. Alternately, functions can be added to this
module to provide persistent data management for other components.

If no USB drive is mounted, the index will be in /data and will point to other
files and directories under /data and /etc. If a USB drive is mounted, the
index and config files should reside there. If it doesn't exist yet, data is
copied there from the prior index, and a new index is written in the USB drive.
"""
import os
import json
import logging
import shutil
from typing import List, Tuple

log = logging.getLogger(__file__)

override_settings_dir = os.environ.get('OVERRIDE_SETTINGS_DIR')
usb_mount_point = '/mnt/usbdrive'
usb_settings_dir = os.path.join(usb_mount_point, 'config')
resin_settings_dir = '/data'
resin_ot_data_dir = os.path.join(
    resin_settings_dir, 'user_storage', 'opentrons_data')
backup_robot_conf = '/etc/robot-data'
backup_labware_def = '/etc/labware'
index_filename = 'index.json'


def settings_dir():
    """
    Looks for an index file in /mnt/usbdrive/config, and then in /data. If
    neither is found, generates an index file and places it in one of those
    locations, preferring the usb drive.

    :return the path where the preferred index.json can be found
    """
    usb_index_file = os.path.join(usb_settings_dir, index_filename)
    resin_index_file = os.path.join(resin_settings_dir, index_filename)
    if override_settings_dir:
        res = override_settings_dir
    elif os.path.exists(usb_index_file):
        res = usb_settings_dir
    elif os.path.exists(resin_index_file):
        res = resin_settings_dir
    else:
        new_path, new_cfg = _generate_base_config()
        try:
            write_base_config(new_path, new_cfg)
        except OSError:
            # If a USB is mounted read-only:
            log.error("Unable to write to {}. Is the mount read-only?".format(
                new_path))
            new_path, new_cfg = _generate_base_config(skip_usb=True)
            write_base_config(new_path, new_cfg)
        finally:
            res = new_path

    return res


def get_config_index() -> dict:
    """
    Load the config index file from the settings directory. The `settings_dir`
    function should guarantee that this file exists.
    :return: the contents of the the base config file
    """
    rewrite_needed = False
    base_path = settings_dir()
    file_path = os.path.join(base_path, index_filename)
    with open(file_path) as base_config_file:
        res = json.load(base_config_file)
    defaults = _generate_base_config()[1]
    for key, default_val in defaults.items():
        if key not in res.keys():
            res[key] = default_val
            rewrite_needed = True
    if rewrite_needed:
        try:
            write_base_config(base_path, res)
        except OSError:
            log.error("Unable to update base config. Is the mount read-only?")
    return res


def _move_settings_data(source_path_dict, dest_path_dict):
    try:
        for key, pth in source_path_dict.items():
            tgt_dir = os.path.dirname(dest_path_dict[key])
            os.makedirs(tgt_dir, exist_ok=True)
            if key.endswith('Dir'):
                log.debug("Copying directory contents onto USB drive")
                # Source directory may not exist, or may be empty
                # If target directory does exist, do not copy
                os.makedirs(pth, exist_ok=True)
                if os.listdir(pth) and not os.path.exists(dest_path_dict[key]):
                    shutil.copytree(pth, dest_path_dict[key])
                else:
                    log.debug("Directory copy preconditions failed:")
                    log.debug("|- Source path exists: {}".format(
                        os.path.exists(pth)))
                    log.debug("|- Number of source files: {}".format(
                        len(os.listdir(pth))))
                    log.debug("|- Target path {} already exists: {}".format(
                        tgt_dir, os.path.exists(tgt_dir)))
            else:
                if os.path.exists(pth):
                    shutil.copy2(pth, dest_path_dict[key])
    except OSError:
        log.exception("Unable to move settings data due to:")


def _flatten_dict(input_dict: dict) -> dict:
    """
    Flattens a nested dictionary, keeping only keys with non-dict values. Note
    that keys will be the underscore-delimited concatenation of the nested path
    of keys from the original dict.
    """
    res = {}
    for k, v in input_dict.items():
        if type(v) is not dict:
            res[k] = v
        else:
            nest = _flatten_dict(v)
            for key, value in nest.items():
                new_key = "{}_{}".format(k, key)
                res[new_key] = value
    return res


def _generate_base_config(skip_usb=False) -> (str, dict):
    """
    Determines where existing info can be found in the system, and creates a
    corresponding data dict that can be written to index.json in the
    baseDataDir.
    :return:
    """
    # Determine where the most preferred place for settings files
    usb_config = {
        'labware': {
            'baseDefinitionDir': os.path.join(
                usb_settings_dir, 'base-definitions'),
            'userDefinitionDir': os.path.join(
                usb_settings_dir, 'user-definitions'),
            'offsetDir': os.path.join(usb_settings_dir, 'offsets')
        },
        'pipetteConfigFile': os.path.join(
            usb_settings_dir, 'pipetteData.json'),
        'featureFlagFile': os.path.join(
            usb_settings_dir, 'flags', 'settings.json'),
        'deckCalibrationFile': os.path.join(
            usb_settings_dir, 'deckCalibration.json'),
        'robotSettingsFile': os.path.join(
            usb_settings_dir, 'robotSettings.json')
    }

    resin_config = {
        'labware': {
            'baseDefinitionDir': '/etc/labware',
            'userDefinitionDir': os.path.join(
                resin_ot_data_dir, 'labware', 'definitions'),
            'offsetDir': os.path.join(
                resin_ot_data_dir, 'labware', 'offsets')
        },
        'pipetteConfigFile': '/etc/robot-data/pipette-config.json',
        'featureFlagFile': os.path.join(resin_settings_dir, 'settings.json'),
        'deckCalibrationFile': os.path.join(
            resin_settings_dir,
            'user_storage',
            'opentrons_data',
            'config.json'),
        'robotSettingsFile': os.path.join(
            resin_settings_dir,
            'user_storage',
            'opentrons_data',
            'robotSettings.json')
    }
    usb_mount_available = os.path.ismount(usb_mount_point)
    if usb_mount_available and not skip_usb:
        try:
            # TODO: it's not clear if this is required, or if the makedirs call
            # TODO: under _move_settings_data is enough. Most of the settings
            # TODO: covered by this module should be in code and configs should
            # TODO: only be stored in one place anyway, so this should be
            # TODO: simplified with that change
            os.makedirs(usb_settings_dir, exist_ok=True)
        except OSError:
            log.exception('Failed to make directories with exception:')
        base_data_dir = usb_settings_dir
        new_cfg = usb_config

        move_source = _flatten_dict(resin_config)
        move_target = _flatten_dict(usb_config)
        _move_settings_data(move_source, move_target)
    else:
        base_data_dir = resin_settings_dir
        new_cfg = resin_config

    return base_data_dir, new_cfg


def write_base_config(path: str, config_data: dict):
    try:
        os.makedirs(path, exist_ok=True)
        with open(os.path.join(path, index_filename), 'w') as base_f:
            json.dump(config_data, base_f, indent=2)
    except OSError:
        log.exception("Base config write failed with exception:")


# ---- Utility functions ----
# These are used for merging override settings with data stored in json,
# primarily in opentrons.robot.robot_configs

def children(value, path=None) -> List[Tuple[tuple, object]]:
    """
    Returns list of tuples containing the full path to the value
    and the value itself
    """
    path = path or []

    return sum([
        children(value=value, path=path+[key])
        for key, value in value.items()
    ], []) if isinstance(value, dict) and value else [
        (tuple(path), value)
    ]


def build(pairs: List[Tuple[tuple, object]]) -> dict:
    """
    Builds a tree out of key-value pairs consisting of full
    path to the value and the value itself
    """
    tree = {}

    def append(tree, path, value):
        if not path:
            return

        key, *tail = path

        if tail:
            tree[key] = tree.get(key, {})
            append(tree[key], tail, value)
        else:
            tree[key] = value

    for path, value in pairs:
        append(tree, path, value)

    return tree


def merge(trees: List[dict]) -> dict:
    """
    Merges trees observing the order,
    adding new elements and overriding existing ones
    """
    return build(sum([children(tree) for tree in trees], []))
