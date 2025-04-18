import { describe, it, expect } from 'vitest'
import { checkLiquidClassCompatibility } from '../../utils'

const mockNotUsedLiquidClass = {
  byPipette: [],
  description: 'Default',
  displayName: "Don't use liquid class settings",
  liquidClassName: 'none',
  namespace: 'opentrons',
  schemaVersion: 1,
}

const mockLiquid = {
  displayName: 'A',
  liquidClassName: '',
  description: '',
  schemaVersion: 0,
  namespace: '',
  byPipette: [],
}

const mockState = {
  pipette: {
    displayName: 'Flex 1-Channel 50 µL',
    model: 'p50',
    displayCategory: 'FLEX',
  } as any,
  mount: 'left',
  tipRack: {
    wells: {
      A1: {
        totalLiquidVolume: 200,
      },
    } as any,
  } as any,
  source: {},
  sourceWells: ['A1'],
  destination: 'source',
  destinationWells: ['A1'],
  transferType: 'transfer',
  volume: 15,
  path: 'single',
  changeTip: 'once',
  dropTipLocation: {
    cutoutFixtureId: 'trashBinAdapter',
    cutoutId: 'cutoutA3',
  },
} as any

describe('checkLiquidClassCompatibility', () => {
  it('no liquid class should return inCompatible false', () => {
    const result = checkLiquidClassCompatibility(
      mockNotUsedLiquidClass,
      mockState
    )
    expect(result.inCompatible).toBe(false)
  })

  it('liquid volume should be less than 10 incompatible', () => {
    mockState.volume = 10
    const result = checkLiquidClassCompatibility(mockLiquid, mockState)
    expect(result.inCompatible).toBe(true)
    expect(result.volumeInCompatible).toBe(true)
  })

  //   it('mock liquid should return inCompatible false', () => {
  //     const result = checkLiquidClassCompatibility(mockLiquid, mockState)
  //     expect(result.inCompatible).toBe(false)
  //     expect(result.pipetteInCompatible).toBe(false)
  //     expect(result.tipRackICompatible).toBe(false)
  //     expect(result.pipettePathInCompatible).toBe(false)
  //   })

  it('', () => {})
  it('', () => {})

  //   it('mock water shouldreturn inCompatible false', () => {
  //     const result = checkLiquidClassCompatibility(mockLiquid, mockState)
  //     expect(result.inCompatible).toBe(false)
  //     expect(result.pipetteInCompatible).toBe(false)
  //     expect(result.tipRackICompatible).toBe(false)
  //     expect(result.pipettePathInCompatible).toBe(false)
  //   })

  //   it('should return false if liquidClass is incompatible', () => {
  //     const result = checkLiquidClassCompatibility(mockLiquid, mockState)
  //     expect(result.inCompatible).toBe(true)
  //   })
})
