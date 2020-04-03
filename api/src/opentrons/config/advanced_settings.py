import json
import asyncio
import logging
import os
import sys
from typing import Any, Dict, Mapping, Tuple, Union, \
    Optional, TYPE_CHECKING, NamedTuple

from opentrons.config import CONFIG, ARCHITECTURE, SystemArchitecture
from opentrons.system import log_control

if TYPE_CHECKING:
    from pathlib import Path  # noqa(F401) - imported for types

log = logging.getLogger(__name__)


SettingsMap = Dict[str, Optional[bool]]


class SettingException(Exception):
    pass


class SettingsData(NamedTuple):
    settings_map: SettingsMap
    version: int


class SettingDefinition:
    def __init__(self, _id: str, title: str, description: str,
                 old_id: str = None,
                 restart_required: bool = False,
                 show_if: Tuple[str, bool] = None):
        self.id = _id
        #: The id of the setting for programmatic access through
        #: get_adv_setting
        self.old_id = old_id
        #: the old id before migration, if any
        self.title = title
        #: User facing title
        self.description = description
        #: User facing description
        self.restart_required = restart_required
        #: True if the user must restart
        self.show_if = show_if
        #: A tuple of (other setting id, setting value) that must match reality
        #: to show this setting in http endpoints

    def __repr__(self):
        return '{}: {}'.format(self.__class__, self.id)

    def should_show(self) -> bool:
        """
        Use show_if attribute to determine if setting should be presented
        to users
        """
        if not self.show_if:
            return True
        return get_setting_with_env_overload(self.show_if[0]) == \
            self.show_if[1]

    def on_change(self, value: Optional[bool]):
        """
        An opportunity for side effects as a result of change a setting
        value
        """
        if self.restart_required:
            set_restart_required()


class DisableLogIntegrationSettingDefinition(SettingDefinition):
    def __init__(self):
        super().__init__(
            _id='disableLogAggregation',
            title='Disable Opentrons Log Collection',
            description='Prevent the robot from sending its logs to Opentrons'
                        ' for analysis. Opentrons uses these logs to'
                        ' troubleshoot robot issues and spot error trends.')

    def on_change(self, value: Optional[bool]):
        """Special side effect for this setting"""
        if ARCHITECTURE == SystemArchitecture.BUILDROOT:
            code, stdout, stderr = asyncio.get_event_loop().run_until_complete(
                log_control.set_syslog_level('emerg' if value else 'info')
            )
            if code != 0:
                log.error(
                    f"Could not set log control: {code}: stdout={stdout}"
                    f" stderr={stderr}")
                raise SettingException(
                    f'Failed to set log upstreaming: {code}'
                )
        super().on_change(value)


class Setting(NamedTuple):
    value: Optional[bool]
    definition: SettingDefinition


# If you add or remove any settings here BE SURE TO ADD A MIGRATION below.
# You will also need to update the migration tests in:
# api/tests/opentrons/config/test_advanced_settings_migration.py
settings = [
    SettingDefinition(
        _id='shortFixedTrash',
        old_id='short-fixed-trash',
        title='Short (55mm) fixed trash',
        description='Trash box is 55mm tall (rather than the 77mm default)'
    ),
    SettingDefinition(
        _id='calibrateToBottom',
        old_id='calibrate-to-bottom',
        title='Calibrate to bottom',
        description='Calibrate using the bottom-center of well A1 for each'
                    ' labware (rather than the top-center)'
    ),
    SettingDefinition(
        _id='deckCalibrationDots',
        old_id='dots-deck-type',
        title='Deck calibration to dots',
        description='Perform deck calibration to dots rather than crosses, for'
                    ' robots that do not have crosses etched on the deck'
    ),
    SettingDefinition(
        _id='useProtocolApi2',
        title='Use Protocol API version 2',
        description='Deprecated feature flag'
    ),
    SettingDefinition(
        _id='disableHomeOnBoot',
        old_id='disable-home-on-boot',
        title='Disable home on boot',
        description='Prevent robot from homing motors on boot'
    ),
    SettingDefinition(
        _id='useOldAspirationFunctions',
        title='Use older aspirate behavior',
        description='Aspirate with the less accurate volumetric calibrations'
                    ' that were used before version 3.7.0. Use this if you'
                    ' need consistency with pre-v3.7.0 results. This only'
                    ' affects GEN1 P10S, P10M, P50S, P50M, and P300S pipettes.'
    ),
    SettingDefinition(
        _id='useFastApi',
        title='Enable experimental HTTP API v2',
        description='Tells the OT-2 to run a newer, highly experimental '
                    'version of its HTTP API based on the FastAPI framework. '
                    'This is an internal setting for Opentrons engineers; '
                    'do not enable this setting or you will break your OT-2.',
        restart_required=True
    ),
]

if ARCHITECTURE == SystemArchitecture.BUILDROOT:
    settings.append(DisableLogIntegrationSettingDefinition())


settings_by_id: Dict[str, SettingDefinition] = \
    {s.id: s for s in settings}
settings_by_old_id: Dict[str, SettingDefinition] = \
    {s.old_id: s for s in settings if s.old_id}


# TODO: LRU cache?
def get_adv_setting(setting: str) -> Optional[Setting]:
    setting = _clean_id(setting)
    s = get_all_adv_settings()
    return s.get(setting, None)


def get_all_adv_settings() -> Dict[str, Setting]:
    """Get all the advanced setting values and definitions"""
    settings_file = CONFIG['feature_flags_file']

    values, _ = _read_settings_file(settings_file)

    return {
        key: Setting(value=value, definition=settings_by_id[key])
        for key, value in values.items() if key in settings_by_id
    }


def set_adv_setting(_id: str, value: Optional[bool]):
    _id = _clean_id(_id)
    settings_file = CONFIG['feature_flags_file']
    setting_data = _read_settings_file(settings_file)
    if _id not in setting_data.settings_map:
        raise ValueError(f"{_id} is not recognized")
    # Side effecting
    settings_by_id[_id].on_change(value)

    setting_data.settings_map[_id] = value
    _write_settings_file(setting_data.settings_map,
                         setting_data.version,
                         settings_file)


def _clean_id(_id: str) -> str:
    if _id in settings_by_old_id.keys():
        _id = settings_by_old_id[_id].id
    return _id


def _read_json_file(path: Union[str, 'Path']) -> Dict[str, Any]:
    try:
        with open(path, 'r') as fd:
            data = json.load(fd)
    except FileNotFoundError:
        data = {}
    except json.JSONDecodeError as e:
        sys.stderr.write(
            f'Could not load advanced settings file {path}: {e}\n')
        data = {}
    return data


def _read_settings_file(settings_file: 'Path') -> SettingsData:
    """
    Read the settings file, which is a json object with settings IDs as keys
    and boolean values. For each key, look up the `Settings` object with that
    key. If the key is one of the old IDs (kebab case), replace it with the
    new ID and rewrite the settings file

    :param settings_file: the path to the settings file
    :return: a dict with all new settings IDs as the keys, and boolean values
        (the values stored in the settings file, or `False` if the key was not
        found). Along with the version.
    """
    # Read settings from persistent file
    data = _read_json_file(settings_file)
    settings, version = _migrate(data)
    settings = _ensure(settings)

    if data.get('_version') != version:
        _write_settings_file(settings, version, settings_file)

    return SettingsData(settings_map=settings, version=version)


def _write_settings_file(data: Mapping[str, Any],
                         version: int,
                         settings_file: 'Path'):
    try:
        with settings_file.open('w') as fd:
            json.dump({**data, '_version': version}, fd)
            fd.flush()
            os.fsync(fd.fileno())
    except OSError:
        log.exception(
            f'Failed to write advanced settings file to {settings_file}')


def _migrate0to1(previous: Mapping[str, Any]) -> SettingsMap:
    """
    Migrate to version 1 of the feature flags file. Replaces old IDs with new
    IDs and sets any False values to None
    """
    next: SettingsMap = {}

    for s in settings:
        id = s.id
        old_id = s.old_id

        if previous.get(id) is True:
            next[id] = True
        elif old_id and previous.get(old_id) is True:
            next[id] = True
        else:
            next[id] = None

    return next


def _migrate1to2(previous: SettingsMap) -> SettingsMap:
    """
    Migration to version 2 of the feature flags file. Adds the
    disableLogAggregation config element.
    """
    newmap = {k: v for k, v in previous.items()}
    newmap['disableLogAggregation'] = None
    return newmap


def _migrate2to3(previous: SettingsMap) -> SettingsMap:
    """
    Migration to version 3 of the feature flags file. Adds the
    enableApi1BackCompat config element.
    """
    newmap = {k: v for k, v in previous.items()}
    newmap['enableApi1BackCompat'] = None
    newmap['useProtocolApi2'] = None
    return newmap


_MIGRATIONS = [_migrate0to1, _migrate1to2, _migrate2to3]
"""
List of all migrations to apply, indexed by (version - 1). See _migrate below
for how the migration functions are applied. Each migration function should
return a new dictionary (rather than modify their input)
"""


def _migrate(data: Mapping[str, Any]) -> SettingsData:
    """
    Check the version integer of the JSON file data a run any necessary
    migrations to get us to the latest file format. Returns dictionary of
    settings and version migrated to
    """
    next = dict(data)
    version = next.pop('_version', 0)
    target_version = len(_MIGRATIONS)
    migrations = _MIGRATIONS[version:]

    if len(migrations) > 0:
        log.info(
            "Migrating advanced settings from version {} to {}"
            .format(version, target_version))

    for m in migrations:
        next = m(next)

    return SettingsData(settings_map=next, version=target_version)


def _ensure(data: Mapping[str, Any]) -> SettingsMap:
    """
    Even after migration, we may have an invalid file. For instance,
    we may have _downgraded_. Make sure all required keys are present.
    """
    newdata = {k: v for k, v in data.items()}
    for s in settings:
        if s.id not in newdata:
            newdata[s.id] = None
    return newdata


def get_setting_with_env_overload(setting_name):
    env_name = 'OT_API_FF_' + setting_name
    if env_name in os.environ:
        return os.environ[env_name].lower() in {'1', 'true', 'on'}
    else:
        s = get_adv_setting(setting_name)
        return s.value is True if s is not None else False


_SETTINGS_RESTART_REQUIRED = False
# This is a bit of global state that indicates whether a setting has changed
# that requires a restart. It's OK for this to be global because the behavior
# it's catching is global - changing the kind of setting that requires a
# a restart anywhere, even if you theoretically have two servers running in
# the same process, will require _all_ of them to be restarted.


def restart_required() -> bool:
    return _SETTINGS_RESTART_REQUIRED


def set_restart_required() -> bool:
    """Set the restart required flag."""
    global _SETTINGS_RESTART_REQUIRED
    _SETTINGS_RESTART_REQUIRED = True
    return _SETTINGS_RESTART_REQUIRED
