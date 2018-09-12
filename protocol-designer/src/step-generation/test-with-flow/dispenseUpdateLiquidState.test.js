// @flow
import merge from 'lodash/merge'
import {
  createEmptyLiquidState,
  createTipLiquidState,
  p300Single,
  p300Multi,
} from './fixtures'

import _updateLiquidState from '../dispenseUpdateLiquidState'

function getBlankLiquidState (sourcePlateType: ?string) {
  return createEmptyLiquidState({
    // leave sourcePlateType undefined for tests that don't care
    // TODO: should this `pipettes` arg be createEmptyLiquidState default?
    sourcePlateType: sourcePlateType || '96-flat',
    pipettes: {
      p300SingleId: p300Single,
      p300MultiId: p300Multi,
    },
  })
}

let dispenseSingleCh150ToA1Args

beforeEach(() => {
  dispenseSingleCh150ToA1Args = {
    labwareId: 'sourcePlateId',
    labwareType: '96-flat',
    pipetteId: 'p300SingleId',
    pipetteData: p300Single,
    volume: 150,
    well: 'A1',
  }
})

describe('...single-channel pipette', () => {
  test('fully dispense single ingredient into empty well', () => {
    const initialLiquidState = merge(
      {},
      getBlankLiquidState(),
      {
        pipettes: {
          p300SingleId: {
            '0': {
              ingred1: {volume: 150},
            },
          },
        },
      }
    )

    const result = _updateLiquidState(
      dispenseSingleCh150ToA1Args,
      initialLiquidState
    )

    expect(result).toMatchObject({
      pipettes: {
        p300SingleId: {
          '0': {
            ingred1: {volume: 0},
          },
        },
      },
      labware: {
        sourcePlateId: {
          A1: {ingred1: {volume: 150}},
          A2: {},
          B1: {},
        },
      },
    })
  })

  test('dispense ingred 1 into well containing ingreds 1 & 2', () => {
    const initialLiquidState = merge(
      {},
      getBlankLiquidState(),
      {
        pipettes: {
          p300SingleId: {
            '0': {
              ingred1: {volume: 150},
            },
          },
        },
        labware: {
          sourcePlateId: {
            A1: {
              ingred1: {volume: 30},
              ingred2: {volume: 50},
            },
          },
        },
      }
    )

    const result = _updateLiquidState(
      dispenseSingleCh150ToA1Args,
      initialLiquidState
    )

    expect(result).toMatchObject({
      pipettes: {
        p300SingleId: {
          '0': {
            ingred1: {volume: 0},
          },
        },
      },
      labware: {
        sourcePlateId: {
          A1: {
            ingred1: {volume: 150 + 30},
            ingred2: {volume: 50},
          },
          A2: {},
          B1: {},
        },
      },
    })
  })

  test('dispense ingred 1 & 2 into well containing 2 & 3', () => {
    const initialLiquidState = merge(
      {},
      getBlankLiquidState(),
      {
        pipettes: {
          p300SingleId: {
            '0': {
              ingred1: {volume: 50},
              ingred2: {volume: 100},
            },
          },
        },
        labware: {
          sourcePlateId: {
            A1: {
              ingred2: {volume: 25},
              ingred3: {volume: 20},
            },
          },
        },
      }
    )

    const result = _updateLiquidState(
      dispenseSingleCh150ToA1Args,
      initialLiquidState
    )

    expect(result).toMatchObject({
      pipettes: {
        p300SingleId: {
          '0': {
            ingred1: {volume: 0},
            ingred2: {volume: 0},
          },
        },
      },
      labware: {
        sourcePlateId: {
          A1: {
            ingred1: {volume: 50},
            ingred2: {volume: 100 + 25},
            ingred3: {volume: 20},
          },
          A2: {},
          B1: {},
        },
      },
    })
  })

  test('partially dispense ingred 1 & 2 into well containing 2 & 3', () => {
    const initialLiquidState = merge(
      {},
      getBlankLiquidState(),
      {
        pipettes: {
          p300SingleId: {
            '0': {
              ingred1: {volume: 50},
              ingred2: {volume: 200},
            },
          },
        },
        labware: {
          sourcePlateId: {
            A1: {
              ingred2: {volume: 25},
              ingred3: {volume: 20},
            },
          },
        },
      }
    )

    const result = _updateLiquidState(
      dispenseSingleCh150ToA1Args,
      initialLiquidState
    )

    expect(result).toMatchObject({
      pipettes: {
        p300SingleId: {
          '0': {
            ingred1: {volume: 20},
            ingred2: {volume: 80},
          },
        },
      },
      labware: {
        sourcePlateId: {
          A1: {
            ingred1: {volume: 0 + (50 - 20)},
            ingred2: {volume: 25 + (200 - 80)},
            ingred3: {volume: 0 + 20},
          },
          A2: {},
          B1: {},
        },
      },
    })
  })

  describe.skip('handle air in pipette tips', () => {
    // TODO Ian 2018-03-16 deal with air (especially regarding air gap)
  })
})

describe('...8-channel pipette', () => {
  describe('dispense into empty column with different ingreds in each tip:', () => {
    const tests = [
      {
        labwareType: '96-flat',
        expectedLabwareMatch: {
          sourcePlateId: {
            A1: {
              ingred2: {volume: 25 + 150},
              ingred3: {volume: 20},
            },
            B1: {},
            C1: {ingred1: {volume: 150}},
            D1: {ingred1: {volume: 150}},
            E1: {ingred1: {volume: 150}},
            F1: {ingred1: {volume: 150}},
            G1: {ingred1: {volume: 150}},
            H1: {ingred1: {volume: 150}},
          },
        },
      },
      {
        labwareType: 'trough-12row',
        expectedLabwareMatch: {
          sourcePlateId: {
            A1: {
              ingred1: {volume: 6 * 150},
              ingred2: {volume: 25 + 150},
              ingred3: {volume: 20},
            },
            A2: {},
          },
        },
      },
      {
        labwareType: '384-plate',
        expectedLabwareMatch: {
          sourcePlateId: {
            A1: {
              ingred2: {volume: 25 + 150},
              ingred3: {volume: 20},
            },
            C1: {},
            E1: {ingred1: {volume: 150}},
            G1: {ingred1: {volume: 150}},
            I1: {ingred1: {volume: 150}},
            K1: {ingred1: {volume: 150}},
            M1: {ingred1: {volume: 150}},
            O1: {ingred1: {volume: 150}},

            // odd rows out
            B1: {},
            D1: {},
            F1: {},
            H1: {},
            J1: {},
            L1: {},
            N1: {},
            P1: {},
          },
        },
      },
    ]

    tests.forEach(({labwareType, expectedLabwareMatch}) => test(labwareType, () => {
      const initialLiquidState = merge(
        {},
        getBlankLiquidState(labwareType),
        {
          pipettes: {
            p300MultiId: {
              // all tips have 150uL of ingred1, except tips 0 and 1
              ...createTipLiquidState(8, {ingred1: {volume: 150}}),
              '0': {
                ingred2: {volume: 200},
              },
              '1': {},
            },
          },
          labware: {
            sourcePlateId: {
              A1: {
                ingred2: {volume: 25},
                ingred3: {volume: 20},
              },
            },
          },
        }
      )

      const result = _updateLiquidState(
        {
          pipetteId: 'p300MultiId',
          pipetteData: p300Multi,
          volume: 150,
          labwareId: 'sourcePlateId',
          labwareType,
          well: 'A1',
        },
        initialLiquidState
      )

      expect(result).toMatchObject({
        pipettes: {
          p300MultiId: {
            ...createTipLiquidState(8, {ingred1: {volume: 0}}),
            '0': {
              ingred2: {volume: 50},
            },
            '1': {},
          },
        },
        labware: expectedLabwareMatch,
      })
    }))
  })
})
