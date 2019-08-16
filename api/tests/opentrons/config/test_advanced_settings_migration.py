from opentrons.config.advanced_settings import _migrate


def test_migrates_empty_object():
    settings, version = _migrate({})

    assert(version == 2)
    assert(settings == {
      'shortFixedTrash': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
      'disableLogAggregation': None
    })


def test_migrates_versionless_new_config():
    settings, version = _migrate({
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': False,
      'disableHomeOnBoot': True,
      'useProtocolApi2': False,
      'useOldAspirationFunctions': True,
    })

    assert(version == 2)
    assert(settings == {
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': True,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': True,
      'disableLogAggregation': None,
    })


def test_migrates_versionless_old_config():
    settings, version = _migrate({
      'short-fixed-trash': False,
      'calibrate-to-bottom': False,
      'dots-deck-type': True,
      'disable-home-on-boot': False,
    })

    assert(version == 2)
    assert(settings == {
      'shortFixedTrash': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': True,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
      'disableLogAggregation': None
    })


def test_ignores_invalid_keys():
    settings, version = _migrate({
      'split-labware-def': True,
      'splitLabwareDefinitions': True
    })

    assert(version == 2)
    assert(settings == {
      'shortFixedTrash': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
      'disableLogAggregation': None,
    })


def test_migrates_v1_config():
    settings, version = _migrate({
      '_version': 1,
      'shortFixedTrash': True,
      'calibrateToBottom': True,
      'deckCalibrationDots': False,
      'disableHomeOnBoot': True,
      'useProtocolApi2': False,
      'useOldAspirationFunctions': True,
    })
    assert version == 2
    assert settings == {
        'shortFixedTrash': True,
        'calibrateToBottom': True,
        'deckCalibrationDots': False,
        'disableHomeOnBoot': True,
        'useProtocolApi2': False,
        'useOldAspirationFunctions': True,
        'disableLogAggregation': None
    }
