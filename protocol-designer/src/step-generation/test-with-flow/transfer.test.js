// @flow
import merge from 'lodash/merge'
import {
  makeContext,
  makeState,
  compoundCommandCreatorNoErrors,
  compoundCommandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import _transfer from '../commandCreators/compound/transfer'

const transfer = compoundCommandCreatorNoErrors(_transfer)
const transferWithErrors = compoundCommandCreatorHasErrors(_transfer)

let transferArgs
let invariantContext
let robotStateWithTip

beforeEach(() => {
  transferArgs = {
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

  // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
  invariantContext = makeContext()
  const makeStateArgs = {
    invariantContext,
    pipetteLocations: { p300SingleId: { mount: 'left' } },
    labwareLocations: {
      tiprack1Id: { slot: '1' },
      sourcePlateId: { slot: '2' },
      destPlateId: { slot: '3' },
    },
  }

  robotStateWithTip = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: true },
  })
  robotStateWithTip.tipState.pipettes.p300SingleId = true
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

      expect(result.commands[0]).toEqual(cmd.pickUpTip('A1'))
    })
  })

  test('...never (should not pick up tip, and fail)', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never',
    }

    const result = transferWithErrors(transferArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
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
  expect(result.commands).toEqual([
    cmd.aspirate('A1', 30),
    cmd.dispense('B2', 30, { labware: 'destPlateId' }),
  ])

  expect(result.robotState.liquidState).toEqual(
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
  expect(result.commands).toEqual([
    cmd.aspirate('A1', 30),
    cmd.dispense('B2', 30, { labware: 'destPlateId' }),

    cmd.aspirate('A2', 30),
    cmd.dispense('C2', 30, { labware: 'destPlateId' }),
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

  const result = transferWithErrors(transferArgs)(
    invariantContext,
    robotStateWithTip
  )

  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]).toMatchObject({
    type: 'PIPETTE_DOES_NOT_EXIST',
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
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 300),
      cmd.dispense('A3', 300, { labware: 'destPlateId' }),
      cmd.aspirate('A1', 50),
      cmd.dispense('A3', 50, { labware: 'destPlateId' }),
      cmd.aspirate('B1', 300),
      cmd.dispense('B3', 300, { labware: 'destPlateId' }),
      cmd.aspirate('B1', 50),
      cmd.dispense('B3', 50, { labware: 'destPlateId' }),
    ])

    expect(result.robotState.liquidState).toEqual(
      merge({}, robotStateWithTip.liquidState, expectedFinalLiquidState)
    )
  })

  test('changeTip="always"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'always',
    }

    const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      cmd.dispense('A3', 300, { labware: 'destPlateId' }),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A1', 50),
      cmd.dispense('A3', 50, { labware: 'destPlateId' }),

      // replace tip before next source-dest well pair
      cmd.dropTip('A1'),
      cmd.pickUpTip('C1'),

      cmd.aspirate('B1', 300),
      cmd.dispense('B3', 300, { labware: 'destPlateId' }),

      // replace tip before next asp-disp chunk
      cmd.dropTip('A1'),
      cmd.pickUpTip('D1'),

      cmd.aspirate('B1', 50),
      cmd.dispense('B3', 50, { labware: 'destPlateId' }),
    ])

    // unlike the other test cases here, we have a new tip when aspirating from B1.
    // so there's only ingred 1, and no ingred 0
    // $FlowFixMe flow doesn't like assigning to these objects
    expectedFinalLiquidState.pipettes.p300SingleId['0'] = { '1': { volume: 0 } }

    // likewise, there's no residue of ingred 0 in B3 from a dirty tip.
    // $FlowFixMe flow doesn't like assigning to these objects
    expectedFinalLiquidState.labware.destPlateId.B3 = { '1': { volume: 350 } }

    expect(result.robotState.liquidState).toEqual(
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
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      cmd.dispense('B1', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A1', 50),
      cmd.dispense('B1', 50, { labware: 'destPlateId' }),

      // same source, different dest: no change
      cmd.aspirate('A1', 300),
      cmd.dispense('B2', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A1', 50),
      cmd.dispense('B2', 50, { labware: 'destPlateId' }),

      // new source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A2', 300),
      cmd.dispense('B2', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A2', 50),
      cmd.dispense('B2', 50, { labware: 'destPlateId' }),
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
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      cmd.dispense('B1', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A1', 50),
      cmd.dispense('B1', 50, { labware: 'destPlateId' }),

      // same source, different dest: change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A1', 300),
      cmd.dispense('B2', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A1', 50),
      cmd.dispense('B2', 50, { labware: 'destPlateId' }),

      // different source, same dest: no change

      cmd.aspirate('A2', 300),
      cmd.dispense('B2', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A2', 50),
      cmd.dispense('B2', 50, { labware: 'destPlateId' }),
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
    expect(result.commands).toEqual([
      // no pick up tip
      cmd.aspirate('A1', 300),
      cmd.dispense('A3', 300, { labware: 'destPlateId' }),

      cmd.aspirate('A1', 50),
      cmd.dispense('A3', 50, { labware: 'destPlateId' }),

      cmd.aspirate('B1', 300),
      cmd.dispense('B3', 300, { labware: 'destPlateId' }),

      cmd.aspirate('B1', 50),
      cmd.dispense('B3', 50, { labware: 'destPlateId' }),
    ])

    expect(result.robotState.liquidState).toEqual(
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
    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      cmd.dispense('A3', 300, { labware: 'destPlateId' }),
      // last 2 chunks split evenly
      cmd.aspirate('A1', 164.5),
      cmd.dispense('A3', 164.5, { labware: 'destPlateId' }),
      cmd.aspirate('A1', 164.5),
      cmd.dispense('A3', 164.5, { labware: 'destPlateId' }),

      cmd.aspirate('B1', 300),
      cmd.dispense('B3', 300, { labware: 'destPlateId' }),
      // last 2 chunks split evenly
      cmd.aspirate('B1', 164.5),
      cmd.dispense('B3', 164.5, { labware: 'destPlateId' }),
      cmd.aspirate('B1', 164.5),
      cmd.dispense('B3', 164.5, { labware: 'destPlateId' }),
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
      expect(result.commands).toEqual([
        // pre-wet aspirate/dispense
        cmd.aspirate('A1', 300),
        cmd.dispense('A1', 300),

        // "real" aspirate/dispenses
        cmd.aspirate('A1', 300),
        cmd.dispense('B1', 300, { labware: 'destPlateId' }),

        cmd.aspirate('A1', 50),
        cmd.dispense('B1', 50, { labware: 'destPlateId' }),
      ])
    })

    test('touch-tip after aspirate should touch-tip on each source well, for every aspirate', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterAspirate: true,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      expect(result.commands).toEqual([
        cmd.aspirate('A1', 300),
        cmd.touchTip('A1'),
        cmd.dispense('B1', 300, { labware: 'destPlateId' }),

        cmd.aspirate('A1', 50),
        cmd.touchTip('A1'),
        cmd.dispense('B1', 50, { labware: 'destPlateId' }),
      ])
    })

    test('touch-tip after dispense should touch-tip on each dest well, for every dispense', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterDispense: true,
      }

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      expect(result.commands).toEqual([
        cmd.aspirate('A1', 300),
        cmd.dispense('B1', 300, { labware: 'destPlateId' }),
        cmd.touchTip('B1', { labware: 'destPlateId' }),

        cmd.aspirate('A1', 50),
        cmd.dispense('B1', 50, { labware: 'destPlateId' }),
        cmd.touchTip('B1', { labware: 'destPlateId' }),
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
        cmd.aspirate('A1', 250),
        cmd.dispense('A1', 250),
        // mix 2
        cmd.aspirate('A1', 250),
        cmd.dispense('A1', 250),
      ]

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      expect(result.commands).toEqual([
        ...mixCommands,
        cmd.aspirate('A1', 300),
        cmd.dispense('B1', 300, { labware: 'destPlateId' }),

        ...mixCommands,
        cmd.aspirate('A1', 50),
        cmd.dispense('B1', 50, { labware: 'destPlateId' }),
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
        cmd.aspirate('B1', 250, { labware: 'destPlateId' }),
        cmd.dispense('B1', 250, { labware: 'destPlateId' }),
        // mix 2
        cmd.aspirate('B1', 250, { labware: 'destPlateId' }),
        cmd.dispense('B1', 250, { labware: 'destPlateId' }),
      ]

      const result = transfer(transferArgs)(invariantContext, robotStateWithTip)
      expect(result.commands).toEqual([
        cmd.aspirate('A1', 300),
        cmd.dispense('B1', 300, { labware: 'destPlateId' }),
        ...mixCommands,

        cmd.aspirate('A1', 50),
        cmd.dispense('B1', 50, { labware: 'destPlateId' }),
        ...mixCommands,
      ])
    })

    test.skip('blowout should blowout in specified labware after each dispense', () => {}) // TODO
  })
})
