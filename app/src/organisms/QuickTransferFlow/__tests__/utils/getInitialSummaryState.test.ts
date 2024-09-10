import { describe, it, expect, vi, afterEach } from 'vitest'
import { getInitialSummaryState } from '../../utils'

describe('getInitialSummaryState', () => {
  const props = {
    state: {
      pipette: {
        channels: 1,
        liquids: {
          default: {
            maxVolume: 100,
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
    } as any,
    deckConfig: [
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    ],
  } as any
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('generates the summary state with correct default value for 1 to 1 transfer', () => {
    const initialSummaryState = getInitialSummaryState(props)
    expect(initialSummaryState).toEqual({
      ...props.state,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'always',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    })
  })
  it('generates the summary state with correct default value for n to 1 transfer', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      state: {
        ...props.state,
        transferType: 'consolidate',
      },
    })
    expect(initialSummaryState).toEqual({
      ...props.state,
      transferType: 'consolidate',
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'multiAspirate',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'always',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    })
  })
  it('generates the summary state with correct default value for n to 1 transfer with too high of volume for multiAspirate', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      state: {
        ...props.state,
        transferType: 'consolidate',
        volume: 60,
      },
    })
    expect(initialSummaryState).toEqual({
      ...props.state,
      transferType: 'consolidate',
      volume: 60,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'always',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    })
  })
  it('generates the summary state with correct default value for 1 to n transfer', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      state: {
        ...props.state,
        volume: 10,
        transferType: 'distribute',
      },
    })
    expect(initialSummaryState).toEqual({
      ...props.state,
      volume: 10,
      transferType: 'distribute',
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'multiDispense',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'always',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
      disposalVolume: 10,
      blowOut: { cutoutId: 'cutoutA3', cutoutFixtureId: 'trashBinAdapter' },
    })
  })
  it('generates the summary state with correct default value for 1 to n transfer with too high of volume for multiDispense', () => {
    const initialSummaryState = getInitialSummaryState({
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
        volume: 60,
      },
    })
    expect(initialSummaryState).toEqual({
      ...props.state,
      transferType: 'distribute',
      volume: 60,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'always',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    })
  })
  it('generates the summary state with correct default change tip if too few tips', () => {
    const destWells = [
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
      'I1',
      'J1',
      'K1',
      'L1',
      'M1',
      'N1',
      'O1',
      'P1',
      'A2',
      'B2',
      'C2',
      'D2',
      'E2',
      'F2',
      'G2',
      'H2',
      'I2',
      'J2',
      'K2',
      'L2',
      'M2',
      'N2',
      'O2',
      'P2',
      'A3',
      'B3',
      'C3',
      'D3',
      'E3',
      'F3',
      'G3',
      'H3',
      'I3',
      'J3',
      'K3',
      'L3',
      'M3',
      'N3',
      'O3',
      'P3',
      'A4',
      'B4',
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'H4',
      'I4',
      'J4',
      'K4',
      'L4',
      'M4',
      'N4',
      'O4',
      'P4',
      'A5',
      'B5',
      'C5',
      'D5',
      'E5',
      'F5',
      'G5',
      'H5',
      'I5',
      'J5',
      'K5',
      'L5',
      'M5',
      'N5',
      'O5',
      'P5',
      'A6',
      'B6',
      'C6',
      'D6',
      'E6',
      'F6',
      'G6',
      'H6',
      'I6',
      'J6',
      'K6',
      'L6',
      'M6',
      'N6',
      'O6',
      'P6',
      'A7',
      'B7',
      'C7',
      'D7',
      'E7',
      'F7',
      'G7',
      'H7',
      'I7',
      'J7',
      'K7',
      'L7',
      'M7',
      'N7',
      'O7',
      'P7',
    ]
    const initialSummaryState = getInitialSummaryState({
      ...props,
      state: {
        ...props.state,
        destinationWells: destWells,
      },
    })
    expect(initialSummaryState).toEqual({
      ...props.state,
      destinationWells: destWells,
      aspirateFlowRate: 50,
      dispenseFlowRate: 75,
      path: 'single',
      tipPositionAspirate: 1,
      preWetTip: false,
      tipPositionDispense: 1,
      changeTip: 'once',
      dropTipLocation: {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      },
    })
  })
})
