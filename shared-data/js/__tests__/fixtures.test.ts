import { useTranslation } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FAKE_STAGING_SLOT_WITH_MAG_BLOCK,
  FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '..'
import {
  getAAComboFixtureDisplayName,
  getAAsToFixtureIdFromDeckDefWithFakes,
  getAAWithFakesFromCutoutFixtureId,
  getCutoutFixtureReplacementIfNeeded,
  getMainAAForAFixture,
  getReplacementFixtureForFakeFixture,
  getReplacementFixtureForFixtureRemoval,
  getVisualSlotIdForAA,
  getVisualSlotIdFromAAId,
  isFixtureInUsbModules,
  replaceCutoutFixtureRemove,
  replaceCutoutFixtureWithComboFixture,
} from '../fixtures'
import { getDeckDefFromRobotType } from '../helpers'

import type { Mock } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

const deckDef = getDeckDefFromRobotType('OT-3 Standard')

describe('getAAFromCutoutFixtureId', () => {
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

describe('getAddressableAreaWithFakesMatchForAreaId', () => {
  it('Should find an aa for flex stacker', () => {
    const result = getMainAAForAFixture(
      'cutoutD3',
      'flexStackerModuleV1',
      'fakeD4'
    )

    expect(result).toEqual('flexStackerModuleV1D4')
  })

  it('Should find an aa for waste chute', () => {
    const result = getMainAAForAFixture(
      'cutoutD3',
      'wasteChuteRightAdapterNoCover',
      'D3'
    )
    expect(result).toEqual('96ChannelWasteChute')
  })

  it('Should find an aa for staging area', () => {
    const result = getMainAAForAFixture(
      'cutoutD3',
      'stagingAreaRightSlot',
      'fakeD4'
    )
    expect(result).toEqual('D4')
  })

  it('Should find an aa for temp module', () => {
    const result = getMainAAForAFixture('cutoutA1', 'temperatureModuleV2', 'A1')
    expect(result).toEqual('temperatureModuleV2A1')
  })
})

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
})

describe('getFlexDeckDefAAByFixtureIdForCutoutId', () => {
  it('Should return a dic of fixtures and aa for cutoutA3', () => {
    const cutoutA3Result = getAAsToFixtureIdFromDeckDefWithFakes(
      'cutoutA3',
      deckDef
    )

    expect(cutoutA3Result).toEqual({
      singleRightSlot: ['A3'],
      stagingAreaRightSlot: ['A3', 'A4'],
      trashBinAdapter: ['movableTrashA3'],
      flexStackerModuleV1WithMagneticBlockV1: [
        'flexStackerModuleV1A4',
        'magneticBlockV1A3',
      ],
      fakeStagingAreaRightSlot: ['A3', 'fakeA4'],
      fakeStagingSlotWithMagBlockV1: ['magneticBlockV1A3', 'fakeA4'],
      heaterShakerModuleV1: ['heaterShakerV1A3'],
      temperatureModuleV2: ['temperatureModuleV2A3'],
      magneticBlockV1: ['magneticBlockV1A3'],
      stagingAreaSlotWithMagneticBlockV1: ['magneticBlockV1A3', 'A4'],
      absorbanceReaderV1: [
        'absorbanceReaderV1A3',
        'absorbanceReaderV1LidDockA4',
      ],
      flexStackerModuleV1: ['flexStackerModuleV1A4', 'A3'],
    })
  })

  it('Should return a dic of fixtures and aa for cutoutD3', () => {
    const cutoutD3Result = getAAsToFixtureIdFromDeckDefWithFakes(
      'cutoutD3',
      deckDef
    )
    console.log('cutoutD3Result: ', cutoutD3Result)
    expect(cutoutD3Result).toEqual({
      absorbanceReaderV1: [
        'absorbanceReaderV1D3',
        'absorbanceReaderV1LidDockD4',
      ],
      fakeStagingAreaRightSlot: ['D3', 'fakeD4'],
      fakeStagingSlotWithMagBlockV1: ['magneticBlockV1D3', 'fakeD4'],
      fakeWasteChuteWithEmptySlot: ['96ChannelWasteChute', 'fakeD4'],
      flexStackerModuleV1: ['D3', 'flexStackerModuleV1D4'],
      flexStackerModuleV1WithMagneticBlockV1: [
        'flexStackerModuleV1D4',
        'magneticBlockV1D3',
      ],
      flexStackerModuleV1WithWasteChuteRightAdapterCovered: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
        'flexStackerModuleV1D4',
      ],
      flexStackerModuleV1WithWasteChuteRightAdapterNoCover: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
        '96ChannelWasteChute',
        'flexStackerModuleV1D4',
        'gripperWasteChute',
      ],
      singleRightSlot: ['D3'],
      stagingAreaRightSlot: ['D3', 'D4'],
      trashBinAdapter: ['movableTrashD3'],
      wasteChuteRightAdapterCovered: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
      ],
      wasteChuteRightAdapterNoCover: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
        '96ChannelWasteChute',
        'gripperWasteChute',
      ],
      stagingAreaSlotWithWasteChuteRightAdapterCovered: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
        'D4',
      ],
      stagingAreaSlotWithWasteChuteRightAdapterNoCover: [
        '1ChannelWasteChute',
        '8ChannelWasteChute',
        '96ChannelWasteChute',
        'D4',
        'gripperWasteChute',
      ],
      heaterShakerModuleV1: ['heaterShakerV1D3'],
      temperatureModuleV2: ['temperatureModuleV2D3'],
      magneticBlockV1: ['magneticBlockV1D3'],
      stagingAreaSlotWithMagneticBlockV1: ['D4', 'magneticBlockV1D3'],
    })
  })
  it('Should return a dic of fixtures and aa for cutoutA1', () => {
    const cutoutA1Result = getAAsToFixtureIdFromDeckDefWithFakes(
      'cutoutA1',
      deckDef
    )
    expect(cutoutA1Result).toEqual({
      singleLeftSlot: ['A1'],
      trashBinAdapter: ['movableTrashA1'],
      thermocyclerModuleV2Rear: [],
      heaterShakerModuleV1: ['heaterShakerV1A1'],
      temperatureModuleV2: ['temperatureModuleV2A1'],
      magneticBlockV1: ['magneticBlockV1A1'],
    })
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
      FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT
    )
    expect(result).toEqual(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
  })

  it('should return mag block fixture instead of FAKE_STAGING_SLOT_WITH_MAG_BLOCK', () => {
    const result = getReplacementFixtureForFakeFixture(
      FAKE_STAGING_SLOT_WITH_MAG_BLOCK
    )
    expect(result).toEqual(MAGNETIC_BLOCK_V1_FIXTURE)
  })
})

describe('getVisualSlotIdForAA', () => {
  it('should get vs name for single right slot', () => {
    const result = getVisualSlotIdForAA(
      'cutoutA3',
      FAKE_STAGING_SLOT_WITH_MAG_BLOCK,
      'magneticBlockV1A3'
    )
    expect(result).toEqual('VSA3')
  })

  it('should return vs name for single center slot', () => {
    const result = getVisualSlotIdForAA(
      'cutoutD1',
      TEMPERATURE_MODULE_V2_FIXTURE,
      'temperatureModuleV2D1'
    )
    expect(result).toEqual('VSD1')
  })

  it('should get vs id for mag block in D2', () => {
    const result = getVisualSlotIdForAA(
      'cutoutD2',
      MAGNETIC_BLOCK_V1_FIXTURE,
      'magneticBlockV1D2'
    )
    expect(result).toEqual('VSD2')
  })
})

describe('replaceCutoutFixtureRemove', () => {
  it('should get fixture replacment for FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE', () => {
    const result = replaceCutoutFixtureRemove(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )
    expect(result).toEqual(FLEX_STACKER_V1_FIXTURE)
  })
  it('should get fixture replacment for MAGNETIC_BLOCK_V1_FIXTURE', () => {
    const result = replaceCutoutFixtureRemove(
      MAGNETIC_BLOCK_V1_FIXTURE,
      'cutoutD3',
      'magneticBlockV1D3'
    )
    expect(result).toEqual(SINGLE_RIGHT_SLOT_FIXTURE)
  })
  it('should get fixture replacment for FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE', () => {
    const result = replaceCutoutFixtureRemove(
      FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      'cutoutD3',
      'flexStackerModuleV1D4'
    )
    expect(result).toEqual(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
  })
})

describe('getAAFixtureDisplayName', () => {
  let t: Mock

  beforeEach(() => {
    t = vi.fn(key => key)

    vi.mocked(useTranslation).mockReturnValue({ t } as any)
  })
  it('Should return flex stacker name when using combo fixtures and aa for stacker', () => {
    const name = getAAComboFixtureDisplayName(
      FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      'flexStackerModuleV1D4',
      deckDef,
      t,
      ''
    )
    expect(name).toEqual('deck_configuration:module_in_port')
  })

  it('Should return mag block name when using combo fixtures with mag block', () => {
    const name = getAAComboFixtureDisplayName(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'magneticBlockV1D3',
      deckDef,
      t,
      'deck_configuration'
    )
    expect(name).toEqual('deck_configuration:magnetic_block')
  })

  it('Should return mag block name when using combo fixtures with mag block', () => {
    const name = getAAComboFixtureDisplayName(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
      'magneticBlockV1D3',
      deckDef,
      t,
      'deck_configuration'
    )
    expect(name).toEqual('deck_configuration:magnetic_block')
  })

  it('Should return waste chute name when using waste chute fixture', () => {
    const name = getAAComboFixtureDisplayName(
      FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT,
      '96ChannelWasteChute',
      deckDef,
      t,
      'deck_configuration'
    )
    expect(name).toEqual('deck_configuration:waste_chute')
  })

  it('Should return null when not a combo fixture', () => {
    const name = getAAComboFixtureDisplayName(
      MAGNETIC_BLOCK_V1_FIXTURE,
      'magneticBlockV1D3',
      deckDef,
      t,
      'deck_configuration'
    )
    expect(name).toBe(null)
  })
})

describe('isFixtureInModules', () => {
  it('should return true for flex stacker fixture', () => {
    const result = isFixtureInUsbModules(FLEX_STACKER_V1_FIXTURE)
    expect(result).toEqual(true)

    const resultWithMag = isFixtureInUsbModules(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE
    )
    expect(resultWithMag).toEqual(true)
  })

  it('should return true for temp fixture', () => {
    const result = isFixtureInUsbModules(TEMPERATURE_MODULE_V2_FIXTURE)
    expect(result).toEqual(true)
  })

  it('should return false for mag block fixture', () => {
    const result = isFixtureInUsbModules(MAGNETIC_BLOCK_V1_FIXTURE)
    expect(result).toEqual(false)
  })
})

describe('getVisualSlotIdFromAAId', () => {
  it('should get VSD4 for flexStackerModuleV1D4', () => {
    const vs = getVisualSlotIdFromAAId('flexStackerModuleV1D4')
    expect(vs).toEqual('VSD4')
  })

  it('should get VSD3 for D3', () => {
    const vs = getVisualSlotIdFromAAId('D3')
    expect(vs).toEqual('VSD3')
  })
})
