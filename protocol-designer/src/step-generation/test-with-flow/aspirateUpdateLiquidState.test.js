// @flow
import {AIR} from '../utils'
import {
  createEmptyLiquidState,
  createTipLiquidState,
  p300Single,
  p300Multi,
} from './fixtures'

import updateLiquidState from '../aspirateUpdateLiquidState'

function getBlankLiquidState (sourcePlateType: ?string) {
  return createEmptyLiquidState({
    // leave sourcePlateType undefined for tests that don't care
    // TODO Ian 2018-03-22: should this `pipettes` arg be createEmptyLiquidState default?
    sourcePlateType: sourcePlateType || '96-flat',
    pipettes: {
      p300SingleId: p300Single,
      p300MultiId: p300Multi,
    },
  })
}
// TODO Ian 2018-03-14 also do tests for tips that contain air
// (prereq: need to define behavior in liquid tracking for that)

describe('...single-channel pipette', () => {
  let aspirateSingleCh50FromA1Args

  beforeEach(() => {
    aspirateSingleCh50FromA1Args = {
      labwareId: 'sourcePlateId',
      labwareType: '96-flat',
      pipetteId: 'p300SingleId',
      pipetteData: p300Single,
      volume: 50,
      well: 'A1',
    }
  })
  describe('...fresh tip', () => {
    test('aspirate from single-ingredient well', () => {
      let initialLiquidState = getBlankLiquidState('96-flat')
      initialLiquidState.labware.sourcePlateId.A1 = {
        ingred1: {
          volume: 200,
        },
      }

      const result = updateLiquidState(
        aspirateSingleCh50FromA1Args,
        initialLiquidState
      )

      expect(result.liquidState).toMatchObject({
        pipettes: {
          p300SingleId: {
            '0': {ingred1: {volume: 50}},
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

    test('aspirate everything + air from a single-ingredient well', () => {
      // aspirate 300 from well with 200, leaving 100 of air
      let initialLiquidState = getBlankLiquidState('96-flat')
      initialLiquidState.labware.sourcePlateId.A1 = {
        ingred1: {
          volume: 200,
        },
      }

      const args = {
        ...aspirateSingleCh50FromA1Args,
        volume: 300,
      }

      const result = updateLiquidState(
        args,
        initialLiquidState
      )

      expect(result.liquidState).toMatchObject({
        pipettes: {
          p300SingleId: {
            '0': {ingred1: {volume: 200}, [AIR]: {volume: 100}},
          },
        },
        labware: {
          sourcePlateId: {
            A1: {ingred1: {volume: 0}},
            A2: {},
            B1: {},
          },
        },
      })
    })

    test('aspirate from two-ingredient well', () => {
      let initialLiquidState = getBlankLiquidState('96-flat')
      initialLiquidState.labware.sourcePlateId.A1 = {
        ingred1: {volume: 200},
        ingred2: {volume: 100},
      }

      const args = {
        ...aspirateSingleCh50FromA1Args,
        volume: 60,
      }

      const result = updateLiquidState(args, initialLiquidState)

      expect(result.liquidState).toMatchObject({
        pipettes: {
          p300SingleId: {
            '0': {ingred1: {volume: 40}, ingred2: {volume: 20}},
          },
        },
        labware: {
          sourcePlateId: {
            A1: {ingred1: {volume: 200 - 40}, ingred2: {volume: 100 - 20}},
          },
        },
      })
    })

    test('aspirate everything + air from two-ingredient well', () => {
      let initialLiquidState = getBlankLiquidState('96-flat')
      initialLiquidState.labware.sourcePlateId.A1 = {
        ingred1: {volume: 60},
        ingred2: {volume: 70},
      }

      const args = {
        ...aspirateSingleCh50FromA1Args,
        volume: 150,
      }

      const result = updateLiquidState(args, initialLiquidState)

      expect(result.liquidState).toMatchObject({
        pipettes: {
          p300SingleId: {
            '0': {ingred1: {volume: 60}, ingred2: {volume: 70}, [AIR]: {volume: 20}},
          },
        },
        labware: {
          sourcePlateId: {
            A1: {ingred1: {volume: 0}, ingred2: {volume: 0}},
          },
        },
      })
    })
  })

  describe('...tip already containing liquid', () => {
    test('aspirate from single-ingredient well', () => {
      let initialLiquidState = getBlankLiquidState('96-flat')
      initialLiquidState.labware.sourcePlateId.A1 = {
        ingred1: {volume: 200},
      }
      initialLiquidState.pipettes.p300SingleId['0'] = {
        ingred1: {volume: 30},
      }

      const result = updateLiquidState(aspirateSingleCh50FromA1Args, initialLiquidState)

      expect(result.liquidState).toMatchObject({
        pipettes: {
          p300SingleId: {
            '0': {ingred1: {volume: 30 + 50}},
          },
        },
        labware: {
          sourcePlateId: {
            A1: {ingred1: {volume: 150}},
          },
        },
      })
    })
  })
})

describe('...8-channel pipette', () => {
  let aspirate8Ch50FromA1Args

  beforeEach(() => {
    aspirate8Ch50FromA1Args = {
      labwareId: 'sourcePlateId',
      labwareType: '96-flat',
      pipetteId: 'p300MultiId',
      pipetteData: p300Multi,
      volume: 50,
      well: 'A1',
    }
  })

  test('aspirate from single-ingredient set of wells (96-flat)', () => {
    let initialLiquidState = getBlankLiquidState('96-flat')

    // A1 and B1 have 1 ingred of different volumes, rest of column 1 is empty
    initialLiquidState.labware.sourcePlateId = {
      ...initialLiquidState.labware.sourcePlateId,
      A1: {ingred1: {volume: 200}},
      B1: {ingred1: {volume: 150}},
    }
    // all pipette tips start with 30 of ingred 1
    initialLiquidState.pipettes.p300MultiId = createTipLiquidState(
      8,
      {ingred1: {volume: 30}}
    )

    const result = updateLiquidState(aspirate8Ch50FromA1Args, initialLiquidState)

    expect(result.liquidState).toMatchObject({
      pipettes: {
        p300MultiId: {
          ...createTipLiquidState(8, {[AIR]: {volume: 50}, ingred1: {volume: 30}}),
          '0': {ingred1: {volume: 50 + 30}},
          '1': {ingred1: {volume: 50 + 30}},
        },
      },
      labware: {
        sourcePlateId: {
          A1: {ingred1: {volume: 200 - 50}},
          B1: {ingred1: {volume: 150 - 50}},
        },
      },
    })
  })

  test('aspirate everything + air from single-ingredient wells (96-flat)', () => {
    let initialLiquidState = getBlankLiquidState('96-flat')

    // A1 and B1 have 1 ingred of different volumes, rest of column 1 is empty
    initialLiquidState.labware.sourcePlateId = {
      ...initialLiquidState.labware.sourcePlateId,
      A1: {ingred1: {volume: 200}},
      B1: {ingred1: {volume: 150}},
    }

    const args = {
      ...aspirate8Ch50FromA1Args,
      volume: 250,
    }

    const result = updateLiquidState(args, initialLiquidState)

    expect(result.liquidState).toMatchObject({
      pipettes: {
        p300MultiId: {
          ...createTipLiquidState(8, {[AIR]: {volume: 250}}),
          '0': {ingred1: {volume: 200}, [AIR]: {volume: 50}},
          '1': {ingred1: {volume: 150}, [AIR]: {volume: 100}},
        },
      },
      labware: {
        sourcePlateId: {
          A1: {ingred1: {volume: 0}},
          B1: {ingred1: {volume: 0}},
        },
      },
    })
  })

  test('aspirate from single-ingredient common well (trough-12row)', () => {
    let initialLiquidState = getBlankLiquidState('trough-12row')

    const initialSourceVolume = 300
    const aspirateVolume = 20

    initialLiquidState.labware.sourcePlateId = {
      ...initialLiquidState.labware.sourcePlateId,
      A1: {ingred1: {volume: initialSourceVolume}},
    }

    const args = {
      ...aspirate8Ch50FromA1Args,
      labwareType: 'trough-12row',
      volume: aspirateVolume,
    }

    const result = updateLiquidState(args, initialLiquidState)

    expect(result.liquidState).toMatchObject({
      pipettes: {
        p300MultiId: {
          // aspirate volume divided among the 8 tips
          ...createTipLiquidState(8, {ingred1: {volume: aspirateVolume}}),
        },
      },
      labware: {
        sourcePlateId: {
          A1: {ingred1: {volume: initialSourceVolume - (aspirateVolume * 8)}},
        },
      },
    })
  })

  test('aspirate from 384 plate starting from B row') // TODO
})
