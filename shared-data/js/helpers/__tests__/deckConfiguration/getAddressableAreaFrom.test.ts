import { describe, expect, it } from 'vitest'

import { getDeckDefFromRobotType } from '../..'
import { getAAWithFakesFromCutoutFixtureId } from '../../deckConfiguration/getAddressableAreaFrom'

const deckDef = getDeckDefFromRobotType('OT-3 Standard')

describe('getAAWithFakesFromCutoutFixtureId', () => {
  it('Should get the aa for a cutoutId and a cutoutFixtureId', () => {
    const result = getAAWithFakesFromCutoutFixtureId(
      'cutoutD3',
      'flexStackerModuleV1',
      deckDef
    )

    const expectedOrder = ['flexStackerModuleV1D4', 'D3']
    expect(result).toEqual(expectedOrder)
  })

  it('Should return undefined if there is no match for a cutoutId and a cutoutFixtureId', () => {
    const result = getAAWithFakesFromCutoutFixtureId(
      'cutoutA1',
      'flexStackerModuleV1',
      deckDef
    )

    expect(result).toBeUndefined()
  })
})
