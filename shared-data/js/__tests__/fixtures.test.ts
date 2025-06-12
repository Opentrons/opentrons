import { describe, expect, it } from 'vitest'

import {
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FLEX_ROBOT_TYPE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '..'
import {
  getAAFromCutoutFixtureId,
  getAddressableAreaMatchForAreaId,
  getCutoutFixtureReplacementIfNeeded,
  getReplacementFixtureForFixtureRemoval,
  replaceCutoutFixtureWithComboFixture,
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

describe('replaceCutoutFixtureWithComboFixture', () => {
  it('Should replace flexStackerModuleV1 to a mag block/stacker combo fixture', () => {
    const result = replaceCutoutFixtureWithComboFixture(
      [
        {
          cutoutFixtureId: 'flexStackerModuleV1',
          cutoutId: 'cutoutD3',
          addressableAreaId: 'flexStackerModuleV1D4',
        },
        {
          cutoutFixtureId: 'stagingAreaRightSlot',
          cutoutId: 'cutoutA3',
          addressableAreaId: 'fakeA4',
        },
      ],
      [
        {
          cutoutFixtureId: 'magneticBlockV1',
          cutoutId: 'cutoutD3',
          addressableAreaId: 'magneticBlockV1D3',
        },
      ],
      'cutoutD3'
    )
    expect(result).toEqual([
      {
        cutoutFixtureId: 'flexStackerModuleV1WithMagneticBlockV1',
        cutoutId: 'cutoutD3',
        addressableAreaId: 'flexStackerModuleV1D4',
        opentronsModuleSerialNumber: undefined,
      },
      {
        cutoutFixtureId: 'stagingAreaRightSlot',
        cutoutId: 'cutoutA3',
        addressableAreaId: 'fakeA4',
      },
    ])
  })

  it('Should replace a waste chute fixture into a combo fixture', () => {
    const result = replaceCutoutFixtureWithComboFixture(
      [
        {
          cutoutFixtureId: 'flexStackerModuleV1',
          cutoutId: 'cutoutD3',
          addressableAreaId: 'flexStackerModuleV1D4',
        },
      ],
      [
        {
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          cutoutId: 'cutoutD3',
          addressableAreaId: '96ChannelWasteChute',
        },
      ],
      'cutoutD3'
    )
    expect(result).toEqual([
      {
        cutoutFixtureId: 'flexStackerModuleV1WithWasteChuteRightAdapterNoCover',
        cutoutId: 'cutoutD3',
        addressableAreaId: 'flexStackerModuleV1D4',
        opentronsModuleSerialNumber: undefined,
      },
    ])
  })

  it('Should not replace fixture', () => {
    const result = replaceCutoutFixtureWithComboFixture(
      [
        {
          cutoutFixtureId: 'flexStackerModuleV1',
          cutoutId: 'cutoutD3',
          addressableAreaId: 'flexStackerModuleV1D4',
        },
      ],
      [],
      'cutoutD3'
    )

    expect(result).toEqual([
      {
        cutoutFixtureId: 'flexStackerModuleV1',
        cutoutId: 'cutoutD3',
        addressableAreaId: 'flexStackerModuleV1D4',
        opentronsModuleSerialNumber: undefined,
      },
    ])
  })
})

describe('getAddressableAreaMatchForAreaId', () => {
  it('Should find an aa for flex stacker', () => {
    const result = getAddressableAreaMatchForAreaId(
      'cutoutD3',
      'flexStackerModuleV1',
      'fakeD4'
    )

    expect(result).toEqual('flexStackerModuleV1D4')
  })

  it('Should find an aa for waste chute', () => {
    const result = getAddressableAreaMatchForAreaId(
      'cutoutD3',
      'wasteChuteRightAdapterNoCover',
      'D3'
    )
    expect(result).toEqual('96ChannelWasteChute')
  })

  it('Should find an aa for staging area', () => {
    const result = getAddressableAreaMatchForAreaId(
      'cutoutD3',
      'stagingAreaRightSlot',
      'fakeD4'
    )
    expect(result).toEqual('D4')
  })

  it('Should find an aa for temp module', () => {
    const result = getAddressableAreaMatchForAreaId(
      'cutoutA1',
      'temperatureModuleV2',
      'A1'
    )
    expect(result).toEqual('temperatureModuleV2A1')
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
