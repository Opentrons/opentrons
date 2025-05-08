import { describe, expect, it, vi } from 'vitest'

import { getAAFromCutoutId } from '../fixtures'
import { getDeckDefFromRobotType } from '../helpers'
import { FLEX_ROBOT_TYPE } from '..'


describe('getAAFromCutoutId', () => {
  it('Should get the aa for a cutoutId and a cutoutFixtureId', () => {
    const result = getAAFromCutoutId('cutoutD3', 'flexStackerModuleV1', getDeckDefFromRobotType(FLEX_ROBOT_TYPE))

    console.log(result)
    const expectedOrder = [ 'flexStackerModuleV1D4', 'D3' ]
    expect(result).toEqual(expectedOrder)
  })

  it('Should return undefined if there is no match for a  cutoutId and a cutoutFixtureId', () => {
    const result = getAAFromCutoutId('cutoutA1', 'flexStackerModuleV1', getDeckDefFromRobotType(FLEX_ROBOT_TYPE))

    expect(result).toBeUndefined()
  })
})
