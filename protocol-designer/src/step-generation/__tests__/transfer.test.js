// @flow
import {
  ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  DEFAULT_PIPETTE,
  delayWithOffset,
  DEST_LABWARE,
  DISPENSE_OFFSET_FROM_BOTTOM_MM,
  dropTipHelper,
  getErrorResult,
  getFlowRateAndOffsetParams,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeAspirateHelper,
  makeContext,
  makeDispenseHelper,
  makeTouchTipHelper,
  pickUpTipHelper,
  SOURCE_LABWARE,
} from '../__fixtures__'
import { transfer } from '../commandCreators/compound/transfer'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper()
const touchTipHelper = makeTouchTipHelper()

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
    aspirateDelay: null,
    dispenseDelay: null,
    aspirateAirGapVolume: null,
    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('pick up tip if no tip on pipette', () => {
  let noTipArgs

  beforeEach(() => {
    noTipArgs = {
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
    it(`...${changeTip}`, () => {
      noTipArgs = {
        ...noTipArgs,
        changeTip,
      }

      const result = transfer(noTipArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)

      expect(res.commands[0]).toEqual(pickUpTipHelper('A1'))
    })
  })

  it('...never (should not pick up tip, and fail)', () => {
    noTipArgs = {
      ...noTipArgs,
      changeTip: 'never',
    }

    const result = transfer(noTipArgs, invariantContext, robotStateWithTip)
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

  const result = transfer(mixinArgs, invariantContext, robotStateWithTip)
  const res = getSuccessResult(result)
  expect(res.commands).toEqual([
    aspirateHelper('A1', 30),
    dispenseHelper('B2', 30),
  ])
})

test('transfer with multiple sets of wells', () => {
  mixinArgs = {
    ...mixinArgs,
    sourceWells: ['A1', 'A2'],
    destWells: ['B2', 'C2'],
    changeTip: 'never',
    volume: 30,
  }
  const result = transfer(mixinArgs, invariantContext, robotStateWithTip)
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

  const result = transfer(mixinArgs, invariantContext, robotStateWithTip)
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

  const result = transfer(mixinArgs, invariantContext, robotStateWithTip)
  const res = getErrorResult(result)

  expect(res.errors).toHaveLength(1)
  expect(res.errors[0]).toMatchObject({
    type: 'LABWARE_DOES_NOT_EXIST',
  })
})

describe('single transfer exceeding pipette max', () => {
  let transferArgs

  beforeEach(() => {
    transferArgs = {
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
  })

  it('changeTip="once"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'once',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),
      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50),
      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),
      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50),
    ])
  })

  it('changeTip="always"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'always',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('A3', 300),

      // replace tip before next asp-disp chunk
      dropTipHelper('A1'),
      pickUpTipHelper('B1'),

      aspirateHelper('A1', 50),
      dispenseHelper('A3', 50),

      // replace tip before next source-dest well pair
      dropTipHelper('A1'),
      pickUpTipHelper('C1'),

      aspirateHelper('B1', 300),
      dispenseHelper('B3', 300),

      // replace tip before next asp-disp chunk
      dropTipHelper('A1'),
      pickUpTipHelper('D1'),

      aspirateHelper('B1', 50),
      dispenseHelper('B3', 50),
    ])
  })

  it('changeTip="perSource"', () => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perSource',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

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
      dropTipHelper('A1'),
      pickUpTipHelper('B1'),

      aspirateHelper('A2', 300),
      dispenseHelper('B2', 300),

      aspirateHelper('A2', 50),
      dispenseHelper('B2', 50),
    ])
  })

  it('changeTip="perDest"', () => {
    // NOTE: same wells as perSource test
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1', 'A1', 'A2'],
      destWells: ['B1', 'B2', 'B2'],
      changeTip: 'perDest',
    }

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      aspirateHelper('A1', 300),
      dispenseHelper('B1', 300),

      aspirateHelper('A1', 50),
      dispenseHelper('B1', 50),

      // same source, different dest: change tip
      dropTipHelper('A1'),
      pickUpTipHelper('B1'),

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

  it('changeTip="never"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never',
    }
    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
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
  })

  it('split up volume without going below pipette min', () => {
    transferArgs = {
      ...transferArgs,
      volume: 629,
      changeTip: 'never', // don't test tip use here
    }

    // begin with tip on pipette
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    const result = transfer(transferArgs, invariantContext, robotStateWithTip)
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
  let advArgs

  beforeEach(() => {
    advArgs = {
      ...mixinArgs,
      sourceWells: ['A1'],
      destWells: ['B1'],
      changeTip: 'never',
    }
  })
  describe('...aspirate options', () => {
    it('pre-wet tip should aspirate and dispense the transfer volume from source well of each subtransfer', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        preWetTip: true,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        // pre-wet aspirate/dispense
        aspirateHelper('A1', 300),
        dispenseHelper('A1', 300, {
          labware: SOURCE_LABWARE,
          offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
        }),

        // "real" aspirate/dispenses
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
      ])
    })

    it('should touchTip after aspirate on each source well, for every aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        touchTipAfterAspirate: true,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
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

    it('should touchTip after dispense on each dest well, for every dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        touchTipAfterDispense: true,
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
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

    it('should mix before aspirate', () => {
      advArgs = {
        ...advArgs,
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
        dispenseHelper('A1', 250, {
          labware: SOURCE_LABWARE,
          offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
        }),
        // mix 2
        aspirateHelper('A1', 250),
        dispenseHelper('A1', 250, {
          labware: SOURCE_LABWARE,
          offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
        }),
      ]

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
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
    it('should delay after mix aspirate and regular aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixBeforeAspirate: {
          volume: 250,
          times: 2,
        },
        aspirateDelay: { seconds: 12, mmFromBottom: 14 },
      }

      const delayCommand = {
        command: 'delay',
        params: { wait: 12 },
      }

      // mixes will include the delays after aspirating
      const mixCommandsWithDelays = [
        // mix 1
        aspirateHelper('A1', 250),
        delayCommand,
        dispenseHelper('A1', 250, {
          labware: SOURCE_LABWARE,
          offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
        }),
        // mix 2
        aspirateHelper('A1', 250),
        delayCommand,
        dispenseHelper('A1', 250, {
          labware: SOURCE_LABWARE,
          offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
        }),
      ]

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...mixCommandsWithDelays,
        aspirateHelper('A1', 300),
        ...delayWithOffset('A1', SOURCE_LABWARE),
        dispenseHelper('B1', 300),

        ...mixCommandsWithDelays,
        aspirateHelper('A1', 50),
        ...delayWithOffset('A1', SOURCE_LABWARE),
        dispenseHelper('B1', 50),
      ])
    })

    it('should delay after aspirate', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        aspirateDelay: { seconds: 12, mmFromBottom: 14 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        ...delayWithOffset('A1', SOURCE_LABWARE),
        dispenseHelper('B1', 300),

        aspirateHelper('A1', 50),
        ...delayWithOffset('A1', SOURCE_LABWARE),
        dispenseHelper('B1', 50),
      ])
    })

    it.todo('air gap => ???') // TODO determine behavior
  })

  describe('...dispense options', () => {
    it('should mix after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        aspirateHelper('B1', 250, {
          labware: DEST_LABWARE,
          offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
        }),
        dispenseHelper('B1', 250),
        // mix 2
        aspirateHelper('B1', 250, {
          labware: DEST_LABWARE,
          offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
        }),
        dispenseHelper('B1', 250),
      ]

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
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
    it('should delay after mix dispense and after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2,
        },
        dispenseDelay: { seconds: 12, mmFromBottom: 14 },
      }

      const delayCommand = {
        command: 'delay',
        params: { wait: 12 },
      }

      // mixes will include the delays after aspirating
      const mixCommandsWithDelays = [
        // mix 1
        aspirateHelper('B1', 250, {
          labware: DEST_LABWARE,
          offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
        }),
        dispenseHelper('B1', 250, {
          labware: DEST_LABWARE,
          offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
        }),
        delayCommand,
        // mix 2
        aspirateHelper('B1', 250, {
          labware: DEST_LABWARE,
          offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
        }),
        dispenseHelper('B1', 250, {
          labware: DEST_LABWARE,
        }),
        delayCommand,
      ]

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),
        // delay after dispense
        ...delayWithOffset('B1', DEST_LABWARE),
        ...mixCommandsWithDelays,

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
        // delay after dispense
        ...delayWithOffset('B1', DEST_LABWARE),
        ...mixCommandsWithDelays,
      ])
    })

    it('should delay after dispense', () => {
      advArgs = {
        ...advArgs,
        volume: 350,
        dispenseDelay: { seconds: 12, mmFromBottom: 14 },
      }

      const result = transfer(advArgs, invariantContext, robotStateWithTip)
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        aspirateHelper('A1', 300),
        dispenseHelper('B1', 300),
        ...delayWithOffset('B1', DEST_LABWARE),

        aspirateHelper('A1', 50),
        dispenseHelper('B1', 50),
        ...delayWithOffset('B1', DEST_LABWARE),
      ])
    })
  })
})
