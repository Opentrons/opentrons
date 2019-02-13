from opentrons.config.advanced_settings import _migrate


def test_migrates_empty_object():
    settings, version = _migrate({})

    assert(version == 1)
    assert(settings == {
      'shortFixedTrash': None,
      'splitLabwareDefinitions': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
    })


def test_migrates_versionless_new_config():
    settings, version = _migrate({
      'shortFixedTrash': True,
      'splitLabwareDefinitions': False,
      'calibrateToBottom': True,
      'deckCalibrationDots': False,
      'disableHomeOnBoot': True,
      'useProtocolApi2': False,
      'useOldAspirationFunctions': True,
    })

    assert(version == 1)
    assert(settings == {
      'shortFixedTrash': True,
      'splitLabwareDefinitions': None,
      'calibrateToBottom': True,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': True,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': True,
    })


def test_migrates_versionless_old_config():
    settings, version = _migrate({
      'short-fixed-trash': False,
      'split-labware-def': True,
      'calibrate-to-bottom': False,
      'dots-deck-type': True,
      'disable-home-on-boot': False,
    })

    assert(version == 1)
    assert(settings == {
      'shortFixedTrash': None,
      'splitLabwareDefinitions': True,
      'calibrateToBottom': None,
      'deckCalibrationDots': True,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
    })


def test_ignores_invalid_keys():
    settings, version = _migrate({
      'foo-bar': True,
      'bazQux': True
    })

    assert(version == 1)
    assert(settings == {
      'shortFixedTrash': None,
      'splitLabwareDefinitions': None,
      'calibrateToBottom': None,
      'deckCalibrationDots': None,
      'disableHomeOnBoot': None,
      'useProtocolApi2': None,
      'useOldAspirationFunctions': None,
    })
