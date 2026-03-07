import { describe, expect, it } from 'vitest'

import { getDeckDefFromRobotType } from '../..'
import {
  getAAForModuleFixture,
  getAAsToFixtureIdFromDeckDefWithFakes,
  getAAWithFakesFromCutoutFixtureId,
  getMainAAForAFixture,
} from '../../deckConfiguration/getAddressableAreaFrom'

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

describe('getAAsToFixtureIdFromDeckDefWithFakes', () => {
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
      vacuumModuleMilliporeV1: ['vacuumModuleMilliporeV1A3', 'A4'],
    })
  })

  it('Should return a dic of fixtures and aa for cutoutD3', () => {
    const cutoutD3Result = getAAsToFixtureIdFromDeckDefWithFakes(
      'cutoutD3',
      deckDef
    )
    expect(cutoutD3Result).toEqual({
      absorbanceReaderV1: [
        'absorbanceReaderV1D3',
        'absorbanceReaderV1LidDockD4',
      ],
      fakeStagingAreaRightSlot: ['D3', 'fakeD4'],
      fakeStagingSlotWithMagBlockV1: ['magneticBlockV1D3', 'fakeD4'],
      fakeWasteChuteWithEmptySlot: ['1ChannelWasteChute', 'fakeD4'],
      flexStackerModuleV1: ['flexStackerModuleV1D4', 'D3'],
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
        'gripperWasteChute',
        'flexStackerModuleV1D4',
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
        'gripperWasteChute',
        'D4',
      ],
      heaterShakerModuleV1: ['heaterShakerV1D3'],
      temperatureModuleV2: ['temperatureModuleV2D3'],
      magneticBlockV1: ['magneticBlockV1D3'],
      stagingAreaSlotWithMagneticBlockV1: ['magneticBlockV1D3', 'D4'],
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

describe('getMainAAForAFixture', () => {
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
    expect(result).toEqual('1ChannelWasteChute')
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

describe('getAAForModuleFixture', () => {
  it('should return temp module aa', () => {
    const result = getAAForModuleFixture(
      'cutoutB3',
      'temperatureModuleV2',
      'temperatureModuleV2'
    )
    expect(result).toEqual('temperatureModuleV2B3')
  })

  it('should return stacker module aa', () => {
    const result = getAAForModuleFixture(
      'cutoutB3',
      'flexStackerModuleV1',
      'flexStackerModuleV1'
    )
    expect(result).toEqual('flexStackerModuleV1B4')
  })
})
