import { describe, expect, it } from 'vitest'

import {
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FLEX_ROBOT_TYPE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '..'
import {
  getAAFromCutoutFixtureId,
  getCutoutFixtureReplacementIfNeeded,
  getReplacementFixtureForFixtureRemoval,
} from '../fixtures'
import { getDeckDefFromRobotType } from '../helpers'

describe('getAAFromCutoutFixtureId', () => {
  it('Should get the aa for a cutoutId and a cutoutFixtureId', () => {
    const result = getAAFromCutoutFixtureId(
      'cutoutD3',
      'flexStackerModuleV1',
      getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    )

    const expectedOrder = ['flexStackerModuleV1D4', 'D3']
    expect(result).toEqual(expectedOrder)
  })

  it('Should return undefined if there is no match for a cutoutId and a cutoutFixtureId', () => {
    const result = getAAFromCutoutFixtureId(
      'cutoutA1',
      'flexStackerModuleV1',
      getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    )

    expect(result).toBeUndefined()
  })
})

describe('getCutoutFixtureReplacementIfNeeded', () => {
  it('Should get FAKE_STAGING_AREA_RIGHT_SLOT if matches condition', () => {
    const result = getCutoutFixtureReplacementIfNeeded(
      SINGLE_RIGHT_SLOT_FIXTURE,
      getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    )

    expect(result).toEqual(FAKE_STAGING_AREA_RIGHT_SLOT)
  })

  it('Should return current cutoutfixtureid when does not match condition', () => {
    const result = getCutoutFixtureReplacementIfNeeded(
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    )

    expect(result).toEqual(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })
})

describe('getReplacementFixtureForFixtureRemoval', () => {
  it('Should get SINGLE_RIGHT_SLOT_FIXTURE to replace staging slot removal', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      'cutoutD3'
    )

    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_RIGHT_SLOT_FIXTURE when using a single right cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutD3'
    )

    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_LEFT_SLOT_FIXTURE when using a single right cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutA1'
    )

    expect(result).toEqual(SINGLE_LEFT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_CENTER_SLOT_FIXTURE when using a single center cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutA2'
    )

    expect(result).toEqual(SINGLE_CENTER_SLOT_FIXTURE)
  })
})
