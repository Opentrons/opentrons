import json
import logging
from copy import copy
from opentrons.config import get_config_index

log = logging.getLogger(__name__)


class Setting:
    def __init__(self, _id, title, description, old_id=None):
        self.id = _id
        self.old_id = old_id
        self.title = title
        self.description = description

    def __repr__(self):
        return '{}: {}'.format(self.__class__, self.id)


settings = [
    Setting(
        _id='shortFixedTrash',
        old_id='short-fixed-trash',
        title='Short (55mm) fixed trash',
        description='Trash box is 55mm tall (rather than the 77mm default)'
    ),
    Setting(
        _id='splitLabwareDefinitions',
        old_id='split-labware-def',
        title='New JSON labware definitions',
        description='JSON labware definitions with a separate def file and'
                    ' offset file for each labware'
    ),
    Setting(
        _id='calibrateToBottom',
        old_id='calibrate-to-bottom',
        title='Calibrate to bottom',
        description='Calibrate using the bottom-center of well A1 for each'
                    ' labware (rather than the top-center)'
    ),
    Setting(
        _id='deckCalibrationDots',
        old_id='dots-deck-type',
        title='Deck calibration to dots',
        description='Perform deck calibration to dots rather than crosses, for'
                    ' robots that do not have crosses etched on the deck'
    ),
    Setting(
        _id='disableHomeOnBoot',
        old_id='disable-home-on-boot',
        title='Disable home on boot',
        description='Prevent robot from homing motors on boot'
    )
]

settings_by_id = {s.id: s for s in settings}
settings_by_old_id = {s.old_id: s for s in settings}


def get_adv_setting(_id: str) -> bool:
    _id = _clean_id(_id)
    s = get_all_adv_settings()
    return s.get(_id).get('value')


def get_all_adv_settings() -> dict:
    """
    :return: a dict of settings keyed by setting ID, where each value is a
        dict with keys "id", "title", "description", and "value"
    """
    settings_file = get_config_index().get('featureFlagFile')

    values = _read_settings_file(settings_file)
    for key, value in values.items():
        s = copy(settings_by_id[key].__dict__)
        s.pop('old_id')
        values[key] = s
        values[key]['value'] = value
    return values


def set_adv_setting(_id: str, value):
    _id = _clean_id(_id)
    settings_file = get_config_index().get('featureFlagFile')
    s = _read_settings_file(settings_file)
    s[_id] = value
    _write_settings_file(s, settings_file)


def _clean_id(_id: str) -> str:
    if _id in settings_by_old_id.keys():
        _id = settings_by_old_id[_id].id
    return _id


def _read_json_file(path: str) -> dict:
    try:
        with open(path, 'r') as fd:
            data = json.load(fd)
    except FileNotFoundError:
        data = {}
    return data


def _read_settings_file(settings_file: str) -> dict:
    """
    Read the settings file, which is a json object with settings IDs as keys
    and boolean values. For each key, look up the `Settings` object with that
    key. If the key is one of the old IDs (kebab case), replace it with the
    new ID and rewrite the settings file

    :param settings_file: the path to the settings file
    :return: a dict with all new settings IDs as the keys, and boolean values
        (the values stored in the settings file, or `False` if the key was not
        found).
    """
    # Read settings from persistent file
    data = _read_json_file(settings_file)
    all_ids = [s.id for s in settings]

    # If any old keys are stored in the file, replace them with the new key
    old_keys = settings_by_old_id.keys()
    if any([k in old_keys for k in data.keys()]):
        for v in data.keys():
            if v in old_keys:
                new_key = settings_by_old_id.get(v).id
                data[new_key] = data[v]
                data.pop(v)
        _write_settings_file(data, settings_file)

    # If any settings do not have a key in the data, default to `False`
    res = {key: data.get(key, False) for key in all_ids}
    return res


def _write_settings_file(data: dict, settings_file: str):
    try:
        with open(settings_file, 'w') as fd:
            json.dump(data, fd)
    except OSError:
        log.exception('Failed to write advanced settings file to: {}'.format(
            settings_file))
