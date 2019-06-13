// @flow
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {
  getInitialRobotStateStandard,
  getRobotStatePickedUpTipStandard,
  makeContext,
  getTipColumn,
  getTiprackTipstate,
  getSuccessResult,
  getErrorResult,
  commandFixtures as cmd,
} from './fixtures'
import { reduceCommandCreators } from '../utils'
import {
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  FIXED_TRASH_ID,
  getFlowRateAndOffsetParams,
  makeAspirateHelper,
  makeDispenseHelper,
  blowoutHelper,
} from './fixtures/commandFixtures'
import _consolidate from '../commandCreators/compound/consolidate'
import type { ConsolidateArgs } from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper()

// collapse this compound command creator into the signature of an atomic command creator
const consolidate = (args: ConsolidateArgs) => (
  invariantContext,
  initialRobotState
) =>
  reduceCommandCreators(
    _consolidate(args)(invariantContext, initialRobotState)
  )(invariantContext, initialRobotState)

function tripleMix(well: string, volume: number, labware: string) {
  return [
    aspirateHelper(well, volume, { labware }),
    dispenseHelper(well, volume, { labware }),
    aspirateHelper(well, volume, { labware }),
    dispenseHelper(well, volume, { labware }),
    aspirateHelper(well, volume, { labware }),
    dispenseHelper(well, volume, { labware }),
  ]
}

let invariantContext
let initialRobotState
let robotInitialStateNoLiquidState
let robotStatePickedUpOneTipNoLiquidState
let robotStatePickedUpMultiTipsNoLiquidState
let robotStatePickedUpOneTip
let baseArgs

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  robotStatePickedUpOneTip = getRobotStatePickedUpTipStandard(invariantContext)

  robotInitialStateNoLiquidState = omit(
    cloneDeep(initialRobotState),
    'liquidState'
  )

  robotStatePickedUpOneTipNoLiquidState = omit(
    cloneDeep(robotStatePickedUpOneTip),
    'liquidState'
  )

  // TODO Ian 2019-04-19: this is a ONE-OFF fixture
  robotStatePickedUpMultiTipsNoLiquidState = merge(
    {},
    robotInitialStateNoLiquidState,
    {
      tipState: {
        tipracks: {
          tiprack1Id: getTipColumn(1, false),
        },
        pipettes: {
          p300MultiId: true,
        },
      },
    }
  )

  baseArgs = {
    // `volume` and `changeTip` should be explicit in tests,
    // those fields intentionally omitted from here
    ...getFlowRateAndOffsetParams(),
    stepType: 'consolidate',
    commandCreatorFnName: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: DEFAULT_PIPETTE,

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'B1',
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }
})

describe('consolidate single-channel', () => {
  test('Minimal single-channel: A1 A2 to B1, 50uL with p300', () => {
    const data = {
      ...baseArgs,
      sourceWells: ['A1', 'A2'],
      volume: 50,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    const res = getSuccessResult(result)
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTip)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 50),
      aspirateHelper('A2', 50),
      dispenseHelper('B1', 100),
    ])
  })

  test('Single-channel with exceeding pipette max: A1 A2 A3 A4 to B1, 150uL with p300', () => {
    // TODO Ian 2018-05-03 is this a duplicate of exceeding max with changeTip="once"???
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])

    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('Single-channel with exceeding pipette max: with changeTip="always"', () => {
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'always',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),
      cmd.dropTip('A1'),

      cmd.pickUpTip('B1'),
      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])

    expect(res.robotState).toMatchObject({
      ...robotInitialStateNoLiquidState,
      tipState: {
        tipracks: {
          ...initialRobotState.tipState.tipracks,
          tiprack1Id: { ...getTiprackTipstate(true), A1: false, B1: false },
        },
        pipettes: {
          ...initialRobotState.tipState.pipettes,
          p300SingleId: true,
        },
      },
    })
  })

  test('Single-channel with exceeding pipette max: with changeTip="once"', () => {
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])

    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('Single-channel with exceeding pipette max: with changeTip="never"', () => {
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'never',
    }

    const result = consolidate(data)(invariantContext, robotStatePickedUpOneTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])

    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix on aspirate should mix before aspirate in first well of chunk only', () => {
    const data = {
      ...baseArgs,
      volume: 100,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      ...tripleMix('A1', 50, SOURCE_LABWARE),

      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('A4', 50, SOURCE_LABWARE),

      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix on aspirate', () => {
    const data = {
      ...baseArgs,
      volume: 125,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      // Start mix
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, { labware: SOURCE_LABWARE }),
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, { labware: SOURCE_LABWARE }),
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, { labware: SOURCE_LABWARE }),
      // done mix
      aspirateHelper('A1', 125),
      aspirateHelper('A2', 125),
      dispenseHelper('B1', 250),

      // Start mix
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, { labware: SOURCE_LABWARE }),
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, { labware: SOURCE_LABWARE }),
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, { labware: SOURCE_LABWARE }),
      // done mix

      aspirateHelper('A3', 125),
      aspirateHelper('A4', 125),
      dispenseHelper('B1', 250),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix after dispense', () => {
    const data = {
      ...baseArgs,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 53 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('B1', 53, DEST_LABWARE),

      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),

      ...tripleMix('B1', 53, DEST_LABWARE),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix after dispense with blowout to trash: first mix, then blowout', () => {
    const data = {
      ...baseArgs,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 54 },
      blowoutLocation: FIXED_TRASH_ID,
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('B1', 54, DEST_LABWARE),

      blowoutHelper(),
      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),

      ...tripleMix('B1', 54, DEST_LABWARE),

      blowoutHelper(),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('"pre-wet tip" should aspirate and dispense consolidate volume from first well of each chunk', () => {
    // TODO LATER Ian 2018-02-13 Should it be 2/3 max volume instead?
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'once',
      preWetTip: true,
      sourceWells: ['A1', 'A2', 'A3', 'A4'],
    }

    const preWetVol = data.volume // NOTE same as volume above... for now

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      // pre-wet tip
      aspirateHelper('A1', preWetVol),
      dispenseHelper('A1', preWetVol, { labware: SOURCE_LABWARE }),
      // done pre-wet

      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      // pre-wet tip, now with A3
      aspirateHelper('A3', preWetVol),
      dispenseHelper('A3', preWetVol, { labware: SOURCE_LABWARE }),
      // done pre-wet

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('touchTip after aspirate should touch tip after every aspirate command', () => {
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'once',
      touchTipAfterAspirate: true,
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    const touchTipAfterAsp = {
      offsetFromBottomMm: baseArgs.touchTipAfterAspirateOffsetMmFromBottom,
    }
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 150),
      cmd.touchTip('A1', touchTipAfterAsp),

      aspirateHelper('A2', 150),
      cmd.touchTip('A2', touchTipAfterAsp),

      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      cmd.touchTip('A3', touchTipAfterAsp),

      aspirateHelper('A4', 150),
      cmd.touchTip('A4', touchTipAfterAsp),

      dispenseHelper('B1', 300),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('touchTip after dispense should touch tip after dispense on destination well', () => {
    const data = {
      ...baseArgs,
      volume: 150,
      changeTip: 'once',
      touchTipAfterDispense: true,
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    const touchTipAfterDisp = {
      labware: DEST_LABWARE,
      offsetFromBottomMm: baseArgs.touchTipAfterDispenseOffsetMmFromBottom,
    }
    expect(res.commands).toEqual([
      cmd.pickUpTip('A1'),

      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),

      dispenseHelper('B1', 300),
      cmd.touchTip('B1', touchTipAfterDisp),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),

      dispenseHelper('B1', 300),
      cmd.touchTip('B1', touchTipAfterDisp),
    ])
    expect(res.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('invalid pipette ID should return error', () => {
    const data = {
      ...baseArgs,
      sourceWells: ['A1', 'A2'],
      volume: 150,
      changeTip: 'once',
      pipette: 'no-such-pipette-id-here',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_DOES_NOT_EXIST')
  })

  test.skip('air gap', () => {}) // TODO Ian 2018-04-05 determine air gap behavior
})

describe('consolidate multi-channel', () => {
  const multiParams = { pipette: 'p300MultiId' }
  const multiDispense = (well: string, volume: number) =>
    dispenseHelper(well, volume, {
      labware: DEST_LABWARE,
      pipette: 'p300MultiId',
    })

  const args = {
    stepType: 'consolidate',
    commandCreatorFnName: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: 'p300MultiId',

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'A12',
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    // volume and changeTip should be explicit in tests

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,

    ...getFlowRateAndOffsetParams(),
  }

  test('simple multi-channel: cols A1 A2 A3 A4 to col A12', () => {
    const data = {
      ...args,
      volume: 140,
      changeTip: 'once',
    }
    const result = consolidate(data)(invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.pickUpTip('A1', multiParams),
      aspirateHelper('A1', 140, multiParams),
      aspirateHelper('A2', 140, multiParams),
      multiDispense('A12', 280),

      aspirateHelper('A3', 140, multiParams),
      aspirateHelper('A4', 140, multiParams),
      multiDispense('A12', 280),
    ])
    expect(res.robotState).toMatchObject(
      robotStatePickedUpMultiTipsNoLiquidState
    )
  })

  // TODO Ian 2018-03-14: address different multi-channel layouts of plates
  test.skip('multi-channel 384 plate: cols A1 B1 A2 B2 to 96-plate col A12', () => {})

  test.skip('multi-channel trough A1 A2 A3 A4 to 96-plate A12', () => {})
})
