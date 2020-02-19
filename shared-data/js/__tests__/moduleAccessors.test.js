// @flow

import {
  getModuleDef2,
  getModuleTypeFromModuleModel,
  getModuleDisplayName,
} from '../modules'

import { MODULE_MODELS } from '../constants'

describe('all valid models work', () => {
  MODULE_MODELS.forEach(model => {
    const loadedDef = getModuleDef2(model)
    test('ensure valid models load', () => {
      expect(loadedDef).not.toBeNull()
      // $FlowFixMe: this is not null because of above expect
      expect(loadedDef.model).toEqual(model)
    })
    test('valid models have module types', () => {
      expect(getModuleTypeFromModuleModel(model)).toEqual(loadedDef.moduleType)
    })
    test('valid modules have display names that arent error', () => {
      expect(getModuleDisplayName(model)).toEqual(loadedDef.displayName)
    })
  })
})
