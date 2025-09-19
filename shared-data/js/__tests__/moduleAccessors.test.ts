import { describe, expect, it } from 'vitest'

import {
  MAGDECK,
  MAGNETIC_MODULE_V1,
  MODULE_MODELS,
  MODULE_TYPES,
  TEMPDECK,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER,
  THERMOCYCLER_MODULE_V1,
} from '../constants'
import {
  getModuleDef,
  getModuleDisplayName,
  getModuleType,
  normalizeModuleModel,
} from '../modules'

describe('all valid models work', () => {
  MODULE_MODELS.forEach(model => {
    const loadedDef = getModuleDef(model)

    it('ensure valid models load', () => {
      expect(loadedDef).not.toBeNull()
      expect(loadedDef?.model).toEqual(model)
    })

    it('valid models have valid module types', () => {
      expect(getModuleType(model)).toEqual(loadedDef.moduleType)
      expect(MODULE_TYPES).toContain(getModuleType(model))
    })

    it('valid modules have display names that match the def', () => {
      expect(getModuleDisplayName(model)).toEqual(loadedDef.displayName)
    })
  })
})

describe('legacy models', () => {
  const legacyEquivs = [
    [TEMPDECK, TEMPERATURE_MODULE_V1],
    [MAGDECK, MAGNETIC_MODULE_V1],
    [THERMOCYCLER, THERMOCYCLER_MODULE_V1],
  ] as const
  it('legacy models work too', () => {
    legacyEquivs.forEach(([legacy, modern]) => {
      const fromLegacy = normalizeModuleModel(legacy)
      expect(fromLegacy).toEqual(modern)
    })
  })
})
