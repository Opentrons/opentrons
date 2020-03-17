// @flow

import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import * as utils from '../utils'

describe('utils', () => {
  describe('isModuleWithCollisionIssue', () => {
    it('returns true if module is a v1 model', () => {
      const result = utils.isModuleWithCollisionIssue(MAGNETIC_MODULE_V1)

      expect(result).toEqual(true)
    })

    it('returns false if module is not a v1 model', () => {
      const result = utils.isModuleWithCollisionIssue(MAGNETIC_MODULE_V2)

      expect(result).toEqual(false)
    })
  })
})
