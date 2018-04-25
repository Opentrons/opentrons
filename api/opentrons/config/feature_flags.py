import os
import json


# In order to specify a location for the settings.json file, export the
# OT_FLAG_DIR environment variable. For example,
# `export OT_FLAG_DIR=$HOME` would cause the server to look in the user's
# home directory for a file named 'settings.json'. Primarily used to override
# feature flags during development.
OVERRIDE_SETTINGS_DIR = os.environ.get('OT_FLAG_DIR')
DEFAULT_SETTINGS_DIR = '/data'
SETTINGS_FILE = 'settings.json'

if OVERRIDE_SETTINGS_DIR:
    SETTINGS_PATH = os.path.join(OVERRIDE_SETTINGS_DIR, SETTINGS_FILE)
else:
    SETTINGS_PATH = os.path.join(DEFAULT_SETTINGS_DIR, SETTINGS_FILE)


def get_feature_flag(name: str) -> bool:
    settings = get_all_feature_flags()
    return bool(settings.get(name))


def get_all_feature_flags() -> dict:
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, 'r') as fd:
                settings = json.load(fd)
        else:
            settings = {}
    except Exception as e:
        print("Error: {}".format(e))
        settings = {}
    return settings


def set_feature_flag(name: str, value):
    if os.path.exists(SETTINGS_PATH):
        with open(SETTINGS_PATH, 'r') as fd:
            settings = json.load(fd)
        settings[name] = value
    else:
        settings = {name: value}
    with open(SETTINGS_PATH, 'w') as fd:
        json.dump(settings, fd)


# short_fixed_trash
# - True ('55.0'): Old (55mm tall) fixed trash
# - False:         77mm tall fixed trash
# - EOL: when all short fixed trash containers have been replaced
def short_fixed_trash(): return get_feature_flag('short-fixed-trash')


# split_labware_definitions
# - True:  Use new labware definitions (See: labware_definitions.py and
#          serializers.py)
# - False: Use sqlite db
def split_labware_definitions(): return get_feature_flag('split-labware-def')


# calibrate_to_bottom
# - True:  You must calibrate your containers to bottom
# - False: Otherwise the default
# will be that you calibrate to the top
def calibrate_to_bottom(): return get_feature_flag('calibrate-to-bottom')
