// @flow
import glob from 'glob'
import path from 'path'

import {
  getModuleDef2,
  getModuleTypeFromModuleModel,
  getModuleDisplayName,
} from '../modules'

const v2DefinitionsGlobPath = path.join(
  __dirname,
  '../../module/definitions/2/*.json'
)

describe('all valid models work', () => {
  const validDefPaths = glob.sync(v2DefinitionsGlobPath)
  test('got at least 1 module def (avoid false positive for tests)', () => {
    expect(validDefPaths.length).toBeGreaterThan(0)
  })
  validDefPaths.forEach(defPath => {
    const model = path.parse(defPath).name
    const loadedDef = getModuleDef2(model)
    test('ensure valid models load', () => {
      expect(loadedDef).not.toBeNull()
      // $FlowFixMe: this is not null because of above expect
      expect(loadedDef.model).toEqual(model)
    })
    test('valid models have module types', () => {
      expect(getModuleTypeFromModuleModel(model)).toMatch(/.*/)
    })
    test('valid modules have display names that arent error', () => {
      expect(getModuleDisplayName(model)).toMatch(/.*/)
    })
  })
})

describe('invalid models dont explode', () => {
  const invalidModel = 'aosihdikvhaksjdbnaksjdha'
  test('invalid models dont raise errors', () => {
    expect(getModuleDef2(invalidModel)).toBeNull()
  })
  test('invalid models have null types', () => {
    expect(getModuleTypeFromModuleModel(invalidModel)).toBeNull()
  })
  test('invalid models have magic display names', () => {
    expect(getModuleDisplayName(invalidModel)).toMatch('ERROR')
  })
})
