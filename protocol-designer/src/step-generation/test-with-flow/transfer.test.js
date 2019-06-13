// @flow
import merge from 'lodash/merge'
import {
  getRobotStateWithTipStandard,
  makeContext,
  commandFixtures as cmd,
  getSuccessResult,
  getErrorResult,
} from './fixtures'
import { reduceCommandCreators } from '../utils'
import {
  getFlowRateAndOffsetParams,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  makeAspirateHelper,
  makeDispenseHelper,
  touchTipHelper,
} from './fixtures/commandFixtures'
import _transfer from '../commandCreators/compound/transfer'
import type { TransferArgs } from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper()

// collapse this compound command creator into the signature of an atomic command creator
const transfer = (args: TransferArgs) => (
  invariantContext,
  initialRobotState
) =>
  reduceCommandCreators(_transfer(args)(invariantContext, initialRobotState))(
    invariantContext,
    initialRobotState
  )

let invariantContext
let robotStateWithTip
let mixinArgs

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParams(),
    commandCreatorFnName: 'transfer',
    name: 'Transfer Test',
    description: 'test blah blah',
    pipette: DEFAULT_PIPETTE,

    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixBeforeAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('pick up tip if no tip on pipette', () => {
  beforeEach(() => {
    mixinArgs = {
      ...mixinArgs,
      sourceWells: ['A1'],
      destWells: ['B2'],
      volume: 30,
    }

    // no tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = false
  })

  const changeTipOptions = ['once', 'always']

  changeTipOptions.forEach(changeTip => {
    test(`...${changeTip}`, () => {
      mixinArgs = {
        ...mixinArgs,
        changeTip,
      }

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)

      expect(res.commands[0]).toEqual(cmd.pickUpTip('A1'))
    })
  })

  test('...never (should not pick up tip, and fail)', () => {
    mixinArgs = {
      ...mixinArgs,
      changeTip: 'never',
    }

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
})

test('single transfer: 1 source & 1 dest', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1'],
    destWells: ['B2'],
    changeTip: 'never',
    volume: 30,
  }

  robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
    '0': { volume: 200 },
  }

  const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    aspirateHelper('A1', 30),
    dispenseHelper('B2', 30),
  ])

  expect(res.robotState.liquidState).toEqual(
    merge({}, robotStateWithTip.liquidState, {
      labware: {
        sourcePlateId: { A1: { '0': { volume: 200 - 30 } } },
        destPlateId: { B2: { '0': { volume: 30 } } },
      },
      pipettes: {
        p300SingleId: { '0': { '0': { volume: 0 } } }, // pipette's Tip 0 has 0uL of Ingred 0 (contamination)
      },
    })
  )
})

test('transfer with multiple sets of wells', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1', 'A2'],
    destWells: ['B2', 'C2'],
    changeTip: 'never',
    volume: 30,
  }
  const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    aspirateHelper('A1', 30),
    dispenseHelper('B2', 30),

    aspirateHelper('A2', 30),
    dispenseHelper('C2', 30),
  ])

  // TODO Ian 2018-04-02 robotState, liquidState checks
})

test('invalid pipette ID should throw error', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
    pipette: 'no-such-pipette-id-here',
  }

  const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'PIPETTE_DOES_NOT_EXIST',
  })
})

test('invalid labware ID should throw error', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceLabware: 'no-such-labware-id-here',
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
  }

  const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'LABWARE_DOES_NOT_EXIST',
  })
})

describe('single transfer exceeding pipette max', () => {
  let expectedFinalLiquidState
  beforeEach(() => {
    mixinArgs = {
      ...mixinArgs,
      sourceWells: ['A1', 'B1'],
      destWells: ['A3', 'B3'],
      volume: 350,
    }
    // tip setup: tiprack's A1 has tip, pipette has no tip
    robotStateWithTip.tipState.tipracks.tiprack1Id.A1 = true
    robotStateWithTip.tipState.pipettes.p300SingleId = false
    // liquid setup
    robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
      '0': { volume: 400 },
    }
    robotStateWithTip.liquidState.labware.sourcePlateId.B1 = {
      '1': { volume: 400 },
    }

    expectedFinalLiquidState = {
      labware: {
        sourcePlateId: {
          A1: { '0': { volume: 400 - 350 } },
          B1: { '1': { volume: 400 - 350 } },
        },
        destPlateId: {
          A3: { '0': { volume: 350 } },
          B3: { '0': { volume: 0 }, '1': { volume: 350 } },
        },
      },
      pipettes: {
        p300SingleId: {
          '0': {
            // pipette's Tip 0 has 0uL of Ingred 0 and 1 (contamination)
            '0': { volume: 0 },
            '1': { volume: 0 },
          },
        },
      },
    }
  })

  test('changeTip="once"', () => {
    mixinArgs = {
      ...mixinArgs,
      changeTip: 'once',
    }

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),
      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50),
      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),
      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50),
    ])

    expect(res.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('changeTip="always"', () => {
    mixinArgs = {
      ...mixinArgs,
      changeTip: 'always',
    }

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50),

      // replace tip before next source-dest well pair
      cmd.dropTip('A1'),
      cmd.pickUpTip('C1'),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('D1'),

      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50),
    ])

    // unlike the other test cases here, we have a new tip when aspirating from B1.
    // so there's only ingred 1, and no ingred 0
    // $FlowFixMe flow doesn't like assigning to these objects
    expectedFinalLiquidState.pipettes.p300SingleId['0'] = { '1': { volume: 0 } }

    // likewise, there's no residue of ingred 0 in B3 from a dirty tip.
    // $FlowFixMe flow doesn't like assigning to these objects
    expectedFinalLiquidState.labware.destPlateId.B3 = { '1': { volume: 350 } }

    expect(res.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('changeTip="perSource"', () => {
    mixinArgs = {
      ...mixinArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perSource',
    }

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B1', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('B1', 50),

      // same source, different dest: no change
      aspirateHelper('A1', 300),
      dispenseHelper('B2', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('B2', 50),

      // new source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A2', 300),
      dispenseHelper('B2', 300),

      aspirateHelper('A2', 50),
      dispenseHelper('B2', 50),
    ])
  })

  test('changeTip="perDest"', () => {
    // NOTE: same wells as perSource test
    mixinArgs = {
      ...mixinArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perDest',
    }

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B1', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('B1', 50),

      // same source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B2', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('B2', 50),

      // different source, same dest: no change

      aspirateHelper('A2', 300),
      dispenseHelper('B2', 300),

      aspirateHelper('A2', 50),
      dispenseHelper('B2', 50),
    ])
  })

  test('changeTip="never"', () => {
    mixinArgs = {
      ...mixinArgs,
      changeTip: 'never',
    }
    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      // no pick up tip
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),

      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50),
    ])

    expect(res.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('split up volume without going below pipette min', () => {
    mixinArgs = {
      ...mixinArgs,
      volume: 629,
      changeTip: 'never', // don't test tip use here
    }

    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),
      // last 2 chunks split evenly
      aspirateHelper('A1', 164.5),
      dispenseHelper('A3', 164.5),
      aspirateHelper('A1', 164.5),
      dispenseHelper('A3', 164.5),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),
      // last 2 chunks split evenly
      aspirateHelper('B1', 164.5),
      dispenseHelper('B3', 164.5),
      aspirateHelper('B1', 164.5),
      dispenseHelper('B3', 164.5),
    ])
  })
})

describe('advanced options', () => {
  beforeEach(() => {
    mixinArgs = {
      ...mixinArgs,
      sourceWells: ['A1'],
      destWells: ['B1'],
      changeTip: 'never',
    }
  })
  describe('...aspirate options', () => {
    test('pre-wet tip should aspirate and dispense transfer volume from source well of each subtransfer', () => {
      mixinArgs = {
        ...mixinArgs,
        volume: 350,
        preWetTip: true,
      }

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // pre-wet aspirate/dispense
        aspirateHelper('A1', 300),
        dispenseHelper('A1', 300, { labware: SOURCE_LABWARE }),

        // "real" aspirate/dispenses
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
      ])
    })

    test('touchTip after aspirate should touchTip on each source well, for every aspirate', () => {
      mixinArgs = {
        ...mixinArgs,
        volume: 350,
        touchTipAfterAspirate: true,
      }

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        touchTipHelper('A1'),
        dispenseHelper('B1', 300),

        aspirateHelper('A1', 50),
        touchTipHelper('A1'),
        dispenseHelper('B1', 50),
      ])
    })

    test('touchTip after dispense should touchTip on each dest well, for every dispense', () => {
      mixinArgs = {
        ...mixinArgs,
        volume: 350,
        touchTipAfterDispense: true,
      }

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),
        touchTipHelper('B1', { labware: DEST_LABWARE }),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
        touchTipHelper('B1', { labware: DEST_LABWARE }),
      ])
    })

    test('mix before aspirate', () => {
      mixinArgs = {
        ...mixinArgs,
        volume: 350,
        mixBeforeAspirate: {
          volume: 250,
          times: 2,
        },
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        aspirateHelper('A1', 250),
        dispenseHelper('A1', 250, { labware: SOURCE_LABWARE }),
        // mix 2
        aspirateHelper('A1', 250),
        dispenseHelper('A1', 250, { labware: SOURCE_LABWARE }),
      ]

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...mixCommands,
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),

        ...mixCommands,
        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
      ])
    })

    test.skip('air gap => ???', () => {}) // TODO determine behavior
  })

  describe('...dispense options', () => {
    test('mix after dispense', () => {
      mixinArgs = {
        ...mixinArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        aspirateHelper('B1', 250, { labware: DEST_LABWARE }),
        dispenseHelper('B1', 250),
        // mix 2
        aspirateHelper('B1', 250, { labware: DEST_LABWARE }),
        dispenseHelper('B1', 250),
      ]

      const result = transfer(mixinArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),
        ...mixCommands,

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
        ...mixCommands,
      ])
    })

    test.skip('blowout should blowout in specified labware after each dispense', () => {}) // TODO
  })
})
