import { describe, expect, it } from 'vitest'

import { getDeckDefFromRobotType } from '../..'
import {
  ABSORBANCE_READER_V1_FIXTURE,
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE,
  FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  VACUUM_MODULE_V1_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '../../../constants'
import {
  getComboFixtureFromFixtureIds,
  getCutoutFixtureReplacementIfNeeded,
  getMainNonComboFixtureId,
  getMainUsbModuleFixtureIdForComboFixture,
  getReplacementFixtureForFakeFixture,
  getReplacementFixtureForFixtureRemoval,
  replaceCutoutFixtureForFixtureRemoval,
} from '../../deckConfiguration/getFixtureFrom'

const deckDef = getDeckDefFromRobotType('OT-3 Standard')

describe('getCutoutFixtureReplacementIfNeeded', () => {
  it('Should get FAKE_STAGING_AREA_RIGHT_SLOT if matches condition', () => {
    const result = getCutoutFixtureReplacementIfNeeded(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutA3',
      deckDef
    )

    expect(result).toEqual(FAKE_STAGING_AREA_RIGHT_SLOT)
  })

  it('Should return current cutoutfixtureid when does not match condition', () => {
    const result = getCutoutFixtureReplacementIfNeeded(
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      'cutoutB3',
      deckDef
    )

    expect(result).toEqual(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })
})

describe('getReplacementFixtureForFixtureRemoval', () => {
  it('Should get SINGLE_RIGHT_SLOT_FIXTURE to replace staging slot removal', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      'cutoutD3',
      'fakeD4'
    )

    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_RIGHT_SLOT_FIXTURE when using a single right cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutD3',
      'D3'
    )

    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_LEFT_SLOT_FIXTURE when using a single right cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutA1',
      'A1'
    )

    expect(result).toEqual(SINGLE_LEFT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_CENTER_SLOT_FIXTURE when using a single center cutout', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      SINGLE_RIGHT_SLOT_FIXTURE,
      'cutoutA2',
      'A2'
    )

    expect(result).toEqual(SINGLE_CENTER_SLOT_FIXTURE)
  })

  it('Should return staging area fixture instead of combo', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )

    expect(result).toEqual(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })

  it('Should return stacker instead of stacker mag block combo', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )

    expect(result).toEqual(FLEX_STACKER_V1_FIXTURE)
  })

  it('Should return staging area fixture when removing waste chute from staging area + waste chute combo', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
      'cutoutD3',
      '1ChannelWasteChute'
    )

    expect(result).toEqual(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })

  it('Should return SINGLE_RIGHT_SLOT_FIXTURE when removing vacuum module from A3', () => {
    const result = getReplacementFixtureForFixtureRemoval(
      VACUUM_MODULE_V1_FIXTURE,
      'cutoutA3',
      'vacuumModuleV1A3'
    )

    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })
})

describe('getReplacementFixtureForFakeFixture', () => {
  it('should return staging slot fixture instead of FAKE_STAGING_AREA_RIGHT_SLOT', () => {
    const result = getReplacementFixtureForFakeFixture(
      FAKE_STAGING_AREA_RIGHT_SLOT
    )
    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })

  it('should return waste chute fixture instead of FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT', () => {
    const result = getReplacementFixtureForFakeFixture(
      FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE
    )
    expect(result).toEqual(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
  })

  it('should return mag block fixture instead of FAKE_STAGING_SLOT_WITH_MAG_BLOCK', () => {
    const result = getReplacementFixtureForFakeFixture(
      FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE
    )
    expect(result).toEqual(MAGNETIC_BLOCK_V1_FIXTURE)
  })
})

describe('replaceCutoutFixtureRemove', () => {
  it('should get fixture replacment for FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )
    expect(result).toEqual(FLEX_STACKER_V1_FIXTURE)
  })

  it('should get fixture replacment for FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE without a stacker', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'cutoutC3',
      'flexStackerModuleV1C4'
    )
    expect(result).toEqual(FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE)
  })

  it('should get fixture replacment for MAGNETIC_BLOCK_V1_FIXTURE', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      MAGNETIC_BLOCK_V1_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )
    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })
  it('should get fixture replacment for FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      'cutoutD3',
      'flexStackerModuleV1D4'
    )
    expect(result).toEqual(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
  })

  it('should get fixture replacment for FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE when waste chute is on removed', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      'cutoutD3',
      '1ChannelWasteChute'
    )
    expect(result).toEqual(FLEX_STACKER_V1_FIXTURE)
  })

  it('should get fixture replacment for ABSORBANCE_READER_V1_FIXTURE', () => {
    const result = replaceCutoutFixtureForFixtureRemoval(
      ABSORBANCE_READER_V1_FIXTURE,
      'cutoutD3',
      'absorbanceReaderV1D3'
    )
    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })
})

describe('getMainUsbModuleFixtureIdForComboFixture', () => {
  it('should get flex stacker module fixture id', () => {
    const result = getMainUsbModuleFixtureIdForComboFixture([
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      FLEX_STACKER_V1_FIXTURE,
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
    ])
    expect(result).toEqual('flexStackerModuleV1')
  })

  it('should return null when no usb module is found', () => {
    const result = getMainUsbModuleFixtureIdForComboFixture([
      WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
    ])
    expect(result).toEqual(null)
  })
})

describe('getMainNonComboFixtureId', () => {
  it('should get main non combo fixture id for waste chute', () => {
    const result = getMainNonComboFixtureId(
      [
        WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
        WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
        STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      ],
      ['gripperWasteChute'],
      'cutoutD3'
    )
    expect(result).toEqual(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
  })

  it('should get main non combo fixture id for staging area', () => {
    const result = getMainNonComboFixtureId(
      [
        STAGING_AREA_RIGHT_SLOT_FIXTURE,
        STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
        STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
        STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      ],
      ['D4'],
      'cutoutD3'
    )
    expect(result).toEqual(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })

  it('should get main non combo fixture id for flex stacker', () => {
    const result = getMainNonComboFixtureId(
      [
        FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
        FLEX_STACKER_V1_FIXTURE,
        FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
        FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
      ],
      ['flexStackerModuleV1D4'],
      'cutoutD3'
    )
    expect(result).toEqual(FLEX_STACKER_V1_FIXTURE)
  })

  it('should get main non combo fixture id for magnetic block', () => {
    const result = getMainNonComboFixtureId(
      [
        FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
        MAGNETIC_BLOCK_V1_FIXTURE,
        STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
      ],
      ['magneticBlockV1D3'],
      'cutoutD3'
    )
    expect(result).toEqual(MAGNETIC_BLOCK_V1_FIXTURE)
  })
})

describe('getComboFixtureFromFixtureIds', () => {
  it('should return flex stacker with waste chute covered combo fixture', () => {
    const result = getComboFixtureFromFixtureIds([
      FLEX_STACKER_V1_FIXTURE,
      WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
    ])
    expect(result).toEqual(
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE
    )
  })

  it('should return flex stacker with waste chute no cover combo fixture', () => {
    const result = getComboFixtureFromFixtureIds([
      FLEX_STACKER_V1_FIXTURE,
      WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    ])
    expect(result).toEqual(
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
    )
  })

  it('should return flex stacker with mag block combo fixture', () => {
    const result = getComboFixtureFromFixtureIds([
      FLEX_STACKER_V1_FIXTURE,
      MAGNETIC_BLOCK_V1_FIXTURE,
    ])
    expect(result).toEqual(FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE)
  })

  it('should return staging area with mag block combo fixture', () => {
    const result = getComboFixtureFromFixtureIds([
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      MAGNETIC_BLOCK_V1_FIXTURE,
    ])
    expect(result).toEqual(STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE)
  })

  it('should return combo fixture regardless of fixture order', () => {
    const result = getComboFixtureFromFixtureIds([
      MAGNETIC_BLOCK_V1_FIXTURE,
      FLEX_STACKER_V1_FIXTURE,
    ])
    expect(result).toEqual(FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE)
  })

  it('should return null when no combo fixture matches', () => {
    const result = getComboFixtureFromFixtureIds([
      FLEX_STACKER_V1_FIXTURE,
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
    ])
    expect(result).toBeNull()
  })

  it('should return null for single fixture that is not a combo', () => {
    const result = getComboFixtureFromFixtureIds([FLEX_STACKER_V1_FIXTURE])
    expect(result).toBeNull()
  })

  it('should return null for empty array', () => {
    const result = getComboFixtureFromFixtureIds([])
    expect(result).toBeNull()
  })
})
