from opentrons.config.advanced_settings import _migrate, _ensure


good_file_version = 3
good_file_settings = {
    'shortFixedTrash': None,
    'calibrateToBottom': None,
    'deckCalibrationDots': None,
    'disableHomeOnBoot': None,
    'useOldAspirationFunctions': None,
    'disableLogAggregation': None,
    'enableApi1BackCompat': None,
    'useProtocolApi2': None,
    'useFastApi': None,
}


def test_migrates_empty_object():
    settings, version = _migrate({})

    assert version == good_file_version
    assert settings == good_file_settings


def test_migrates_versionless_new_config():
    settings, version = _migrate({
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': False,
      'disableHomeOnBoot': True,
      'useOldAspirationFunctions': True,
    })

    assert version == good_file_version
    assert settings == {
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': True,
      'useOldAspirationFunctions': True,
      'disableLogAggregation': None,
      'enableApi1BackCompat': None,
      'useProtocolApi2': None,
      'useFastApi': None
    }


def test_migrates_versionless_old_config():
    settings, version = _migrate({
      'short-fixed-trash': False,
      'calibrate-to-bottom': False,
      'dots-deck-type': True,
      'disable-home-on-boot': False,
    })

    assert version == good_file_version
    assert settings == {
      'shortFixedTrash': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': True,
      'disableHomeOnBoot': None,
      'useOldAspirationFunctions': None,
      'disableLogAggregation': None,
      'enableApi1BackCompat': None,
      'useProtocolApi2': None,
      'useFastApi': None
    }


def test_ignores_invalid_keys():
    settings, version = _migrate({
      'split-labware-def': True,
      'splitLabwareDefinitions': True
    })

    assert version == good_file_version
    assert settings == good_file_settings


def test_migrates_v1_config():
    settings, version = _migrate({
      '_version': 1,
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': False,
      'disableHomeOnBoot': True,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': True,
    })
    assert version == good_file_version
    assert settings == {
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': None,
        'useProtocolApi2': None,
        'enableApi1BackCompat': None,
    }


def test_migrates_v2_config():
    settings, version = _migrate({
        '_version': 2,
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useProtocolApi2': None,
        'enableApi1BackCompat': False,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': False,
    })

    assert version == good_file_version
    assert settings == {
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': False,
        'useProtocolApi2': None,
        'enableApi1BackCompat': None,
    }


def test_migrates_v3_config():
    settings, version = _migrate({
        '_version': 3,
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useProtocolApi2': None,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': False,
        'enableApi1BackCompat': False
    })
    assert version == good_file_version
    assert settings == {
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': False,
        'useProtocolApi2': None,
        'enableApi1BackCompat': False,
    }


def test_ensures_config():
    assert _ensure(
        {'_version': 3,
         'shortFixedTrash': False,
         'disableLogAggregation': True})\
         == {
             '_version': 3,
             'shortFixedTrash': False,
             'calibrateToBottom': None,
             'deckCalibrationDots': None,
             'disableHomeOnBoot': None,
             'useOldAspirationFunctions': None,
             'disableLogAggregation': True,
             'useProtocolApi2': None,
             'useFastApi': None
         }
