import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getInitialSummaryState } from '../../utils'
import { getVolumeRange } from '../../utils/getVolumeRange'

vi.mock('../../utils/getVolumeRange')

describe('getInitialSummaryState', () => {
  const props = {
    pipette: {
      liquids: {
        default: {
          supportedTips: {
            t50: {
              defaultAspirateFlowRate: {
                default: 50,
              },
              defaultDispenseFlowRate: {
                default: 75,
              },
            },
          },
        },
      },
    } as any,
    mount: 'left',
    tipRack: {
      wells: {
        A1: {
          totalLiquidVolume: 50,
        },
      },
    } as any,
    source: {} as any,
    sourceWells: ['A1'],
    destination: 'source',
    destinationWells: ['A1'],
    transferType: 'transfer',
    volume: 25,
  } as any
  beforeEach(() => {
    vi.mocked(getVolumeRange).mockReturnValue({ min: 5, max: 100 })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('generates the summary state with correct default value for 1 to 1 transfer', () => {
    const initialSummaryState = getInitialSummaryState(props)
    expect(initialSummaryState).toEqual({
      ...props,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: 'trashBin',
    })
  })
  it('generates the summary state with correct default value for n to 1 transfer', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      transferType: 'consolidate',
    })
    expect(initialSummaryState).toEqual({
      ...props,
      transferType: 'consolidate',
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'multiAspirate',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: 'trashBin',
    })
  })
  it('generates the summary state with correct default value for n to 1 transfer with too high of volume for multiAspirate', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      transferType: 'consolidate',
      volume: 60,
    })
    expect(initialSummaryState).toEqual({
      ...props,
      transferType: 'consolidate',
      volume: 60,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: 'trashBin',
    })
  })
  it('generates the summary state with correct default value for 1 to n transfer', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      transferType: 'distribute',
    })
    expect(initialSummaryState).toEqual({
      ...props,
      transferType: 'distribute',
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'multiDispense',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: 'trashBin',
    })
  })
  it('generates the summary state with correct default value for 1 to n transfer with too high of volume for multiDispense', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      transferType: 'distribute',
      volume: 60,
    })
    expect(initialSummaryState).toEqual({
      ...props,
      transferType: 'distribute',
      volume: 60,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: 'trashBin',
    })
  })
})
