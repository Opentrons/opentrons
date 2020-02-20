// @flow

import {
  getModuleDef2,
  getModuleTypeFromModuleModel,
  getModuleDisplayName,
} from '../modules'

import {
  MODULE_MODELS,
  MODULE_TYPES,
  TEMPDECK,
  MAGDECK,
  THERMOCYCLER,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
} from '../constants'

describe('all valid models work', () => {
  MODULE_MODELS.forEach(model => {
    const loadedDef = getModuleDef2(model)
    test('ensure valid models load', () => {
      expect(loadedDef).not.toBeNull()
      expect(loadedDef?.model).toEqual(model)
    })
    test('valid models have valid module types', () => {
      expect(getModuleTypeFromModuleModel(model)).toEqual(loadedDef.moduleType)
      expect(MODULE_TYPES).toContain(getModuleTypeFromModuleModel(model))
    })
    test('valid modules have display names that match the def', () => {
      expect(getModuleDisplayName(model)).toEqual(loadedDef.displayName)
    })
  })
})

describe('legacy models work too', () => {
  const legacyEquivs = [
    [TEMPDECK, TEMPERATURE_MODULE_V1],
    [MAGDECK, MAGNETIC_MODULE_V1],
    [THERMOCYCLER, THERMOCYCLER_MODULE_V1],
  ]
  legacyEquivs.forEach(([legacy, modern]) => {
    const fromLegacy = getModuleDef2(legacy)
    expect(fromLegacy?.model).toEqual(modern)
  })
})
