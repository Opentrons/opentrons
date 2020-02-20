// @flow

import {
  getModuleDef2,
  getModuleTypeFromModuleModel,
  getModuleDisplayName,
} from '../modules'

import { MODULE_MODELS, MODULE_TYPES } from '../constants'

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
