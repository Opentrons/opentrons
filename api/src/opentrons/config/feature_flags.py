import os
from opentrons.config import advanced_settings as advs


def get_setting_with_env_overload(setting_name):
    env_name = 'OT_API_FF_' + setting_name
    if env_name in os.environ:
        return os.environ[env_name].lower() in ('1', 'true', 'on')
    else:
        return advs.get_adv_setting(setting_name) is True


def short_fixed_trash():
    return get_setting_with_env_overload('shortFixedTrash')


def calibrate_to_bottom():
    return get_setting_with_env_overload('calibrateToBottom')


def dots_deck_type():
    return get_setting_with_env_overload('deckCalibrationDots')


def disable_home_on_boot():
    return get_setting_with_env_overload('disableHomeOnBoot')


def use_protocol_api_v2():
    return get_setting_with_env_overload('useProtocolApi2')


def use_old_aspiration_functions():
    return get_setting_with_env_overload('useOldAspirationFunctions')
