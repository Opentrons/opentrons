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
import _transfer from '../commandCreators/compound/transfer'
import type { TransferArgs } from '../types'

// collapse this compound command creator into the signature of an atomic command creator
const transfer = (args: TransferArgs) => (
  invariantContext,
  initialRobotState
) =>
  reduceCommandCreators(_transfer(args)(invariantContext, initialRobotState))(
    invariantContext,
    initialRobotState
  )

// TODO IMMEDIATELY: this is duplicated in consolidate and probably distribute
// NOTE: make sure none of these numbers match!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
const BLOWOUT_FLOW_RATE = 2.3

const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
const BLOWOUT_OFFSET_FROM_BOTTOM_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_BOTTOM_MM = 3.4

const aspirateHelper = (well: string, volume: number, params = null) =>
  cmd.aspirate(well, volume, {
    offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  })

const dispenseHelper = (well, volume, params = null) =>
  cmd.dispense(well, volume, {
    labware: 'sourcePlateId', // TODO IMMEDIATELY: THIS IS DIFFERENT THAN CONSOLIDATE
    offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    flowRate: DISPENSE_FLOW_RATE,
    ...params,
  })

// TODO IMMEDIATELY: THIS IS NEW vs CONSOLIDATE
const touchTipHelper = (well, params) =>
  cmd.touchTip(well, {
    offsetFromBottomMm: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
    ...params,
  })

let invariantContext
let robotStateWithTip
let transferArgs
let flowRatesAndOffsets

beforeEach(() => {
  flowRatesAndOffsets = {
    aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
    dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
    blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
    aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
    dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    blowoutOffsetFromBottomMm: BLOWOUT_OFFSET_FROM_BOTTOM_MM,
    touchTipAfterAspirateOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
    touchTipAfterDispenseOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
  }

  transferArgs = {
    ...flowRatesAndOffsets,
    commandCreatorFnName: 'transfer',
    name: 'Transfer Test',
    description: 'test blah blah',
    pipette: 'p300SingleId',

    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

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
    transferArgs = {
      ...transferArgs,
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
      transferArgs = {
        ...transferArgs,
        changeTip,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)

      expect(res.commands[0]).toEqual(cmd.pickUpTip('A1'))
    })
  })

  test('...never (should not pick up tip, and fail)', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
})

test('single transfer: 1 source & 1 dest', () => {
  transferArgs = {
    ...transferArgs,
    sourceWells: ['A1'],
    destWells: ['B2'],
    changeTip: 'never',
    volume: 30,
  }

  robotStateWithTip.liquidState.labware.sourcePlateId.A1 = {
    '0': { volume: 200 },
  }

  const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    aspirateHelper('A1', 30),
    dispenseHelper('B2', 30, { labware: 'destPlateId' }),
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
  transferArgs = {
    ...transferArgs,
    sourceWells: ['A1', 'A2'],
    destWells: ['B2', 'C2'],
    changeTip: 'never',
    volume: 30,
  }
  const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    aspirateHelper('A1', 30),
    dispenseHelper('B2', 30, { labware: 'destPlateId' }),

    aspirateHelper('A2', 30),
    dispenseHelper('C2', 30, { labware: 'destPlateId' }),
  ])

  // TODO Ian 2018-04-02 robotState, liquidState checks
})

test('invalid pipette ID should throw error', () => {
  transferArgs = {
    ...transferArgs,
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
    pipette: 'no-such-pipette-id-here',
  }

  const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'PIPETTE_DOES_NOT_EXIST',
  })
})

test('invalid labware ID should throw error', () => {
  transferArgs = {
    ...transferArgs,
    sourceLabware: 'no-such-labware-id-here',
    sourceWells: ['A1'],
    destWells: ['B1'],
    volume: 10,
    changeTip: 'always',
  }

  const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'LABWARE_DOES_NOT_EXIST',
  })
})

describe('single transfer exceeding pipette max', () => {
  let expectedFinalLiquidState
  beforeEach(() => {
    transferArgs = {
      ...transferArgs,
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
    transferArgs = {
      ...transferArgs,
      changeTip: 'once',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300, { labware: 'destPlateId' }),
      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50, { labware: 'destPlateId' }),
      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300, { labware: 'destPlateId' }),
      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50, { labware: 'destPlateId' }),
    ])

    expect(res.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('changeTip="always"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'always',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300, { labware: 'destPlateId' }),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50, { labware: 'destPlateId' }),

      // replace tip before next source-dest well pair
      cmd.dropTip('A1'),
      cmd.pickUpTip('C1'),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300, { labware: 'destPlateId' }),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('D1'),

      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50, { labware: 'destPlateId' }),
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
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perSource',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B1', 300, { labware: 'destPlateId' }),

      aspirateHelper('A1', 50),
      dispenseHelper('B1', 50, { labware: 'destPlateId' }),

      // same source, different dest: no change
      aspirateHelper('A1', 300),
      dispenseHelper('B2', 300, { labware: 'destPlateId' }),

      aspirateHelper('A1', 50),
      dispenseHelper('B2', 50, { labware: 'destPlateId' }),

      // new source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A2', 300),
      dispenseHelper('B2', 300, { labware: 'destPlateId' }),

      aspirateHelper('A2', 50),
      dispenseHelper('B2', 50, { labware: 'destPlateId' }),
    ])
  })

  test('changeTip="perDest"', () => {
    // NOTE: same wells as perSource test
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perDest',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B1', 300, { labware: 'destPlateId' }),

      aspirateHelper('A1', 50),
      dispenseHelper('B1', 50, { labware: 'destPlateId' }),

      // same source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B2', 300, { labware: 'destPlateId' }),

      aspirateHelper('A1', 50),
      dispenseHelper('B2', 50, { labware: 'destPlateId' }),

      // different source, same dest: no change

      aspirateHelper('A2', 300),
      dispenseHelper('B2', 300, { labware: 'destPlateId' }),

      aspirateHelper('A2', 50),
      dispenseHelper('B2', 50, { labware: 'destPlateId' }),
    ])
  })

  test('changeTip="never"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never',
    }
    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      // no pick up tip
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300, { labware: 'destPlateId' }),

      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50, { labware: 'destPlateId' }),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300, { labware: 'destPlateId' }),

      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50, { labware: 'destPlateId' }),
    ])

    expect(res.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('split up volume without going below pipette min', () => {
    // TODO: Ian 2019-01-04 for some reason, doing transferArgs = {...transferArgs, ...etc}
    // works everywhere but here - here, it makes Jest fail with "Jest encountered an unexpected token"
    const _transferArgs = {
      ...transferArgs,
      volume: 629,
      changeTip: 'never', // don't test tip use here
    }
    transferArgs = _transferArgs

    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300, { labware: 'destPlateId' }),
      // last 2 chunks split evenly
      aspirateHelper('A1', 164.5),
      dispenseHelper('A3', 164.5, { labware: 'destPlateId' }),
      aspirateHelper('A1', 164.5),
      dispenseHelper('A3', 164.5, { labware: 'destPlateId' }),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300, { labware: 'destPlateId' }),
      // last 2 chunks split evenly
      aspirateHelper('B1', 164.5),
      dispenseHelper('B3', 164.5, { labware: 'destPlateId' }),
      aspirateHelper('B1', 164.5),
      dispenseHelper('B3', 164.5, { labware: 'destPlateId' }),
    ])
  })
})

describe('advanced options', () => {
  beforeEach(() => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1'],
      destWells: ['B1'],
      changeTip: 'never',
    }
  })
  describe('...aspirate options', () => {
    test('pre-wet tip should aspirate and dispense transfer volume from source well of each subtransfer', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        preWetTip: true,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // pre-wet aspirate/dispense
        aspirateHelper('A1', 300),
        dispenseHelper('A1', 300),

        // "real" aspirate/dispenses
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300, { labware: 'destPlateId' }),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50, { labware: 'destPlateId' }),
      ])
    })

    test('touchTip after aspirate should touchTip on each source well, for every aspirate', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterAspirate: true,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        touchTipHelper('A1'),
        dispenseHelper('B1', 300, { labware: 'destPlateId' }),

        aspirateHelper('A1', 50),
        touchTipHelper('A1'),
        dispenseHelper('B1', 50, { labware: 'destPlateId' }),
      ])
    })

    test('touchTip after dispense should touchTip on each dest well, for every dispense', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterDispense: true,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300, { labware: 'destPlateId' }),
        touchTipHelper('B1', { labware: 'destPlateId' }),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50, { labware: 'destPlateId' }),
        touchTipHelper('B1', { labware: 'destPlateId' }),
      ])
    })

    test('mix before aspirate', () => {
      transferArgs = {
        ...transferArgs,
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
        dispenseHelper('A1', 250),
        // mix 2
        aspirateHelper('A1', 250),
        dispenseHelper('A1', 250),
      ]

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...mixCommands,
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300, { labware: 'destPlateId' }),

        ...mixCommands,
        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50, { labware: 'destPlateId' }),
      ])
    })

    test.skip('air gap => ???', () => {}) // TODO determine behavior
  })

  describe('...dispense options', () => {
    test('mix after dispense', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        aspirateHelper('B1', 250, { labware: 'destPlateId' }),
        dispenseHelper('B1', 250, { labware: 'destPlateId' }),
        // mix 2
        aspirateHelper('B1', 250, { labware: 'destPlateId' }),
        dispenseHelper('B1', 250, { labware: 'destPlateId' }),
      ]

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300, { labware: 'destPlateId' }),
        ...mixCommands,

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50, { labware: 'destPlateId' }),
        ...mixCommands,
      ])
    })

    test.skip('blowout should blowout in specified labware after each dispense', () => {}) // TODO
  })
})
