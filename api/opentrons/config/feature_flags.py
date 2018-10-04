from functools import lru_cache
from opentrons.config import advanced_settings as advs


def short_fixed_trash():
    return advs.get_adv_setting('shortFixedTrash')


@lru_cache()
def split_labware_definitions():
    return advs.get_adv_setting('splitLabwareDefinitions')


def calibrate_to_bottom():
    return advs.get_adv_setting('calibrateToBottom')


def dots_deck_type():
    return advs.get_adv_setting('deckCalibrationDots')


def disable_home_on_boot():
    return advs.get_adv_setting('disableHomeOnBoot')


def use_protocol_api_v2():
    return advs.get_adv_setting('useProtocolApi2')
