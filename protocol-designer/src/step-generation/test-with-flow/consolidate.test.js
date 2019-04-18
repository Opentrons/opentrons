// @flow
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {
  makeContext,
  makeState,
  getTipColumn,
  getTiprackTipstate,
  compoundCommandCreatorNoErrors,
  compoundCommandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import _consolidate from '../commandCreators/compound/consolidate'

const consolidate = compoundCommandCreatorNoErrors(_consolidate)
const consolidateWithErrors = compoundCommandCreatorHasErrors(_consolidate)

// shorthand
const dispense = (well, volume) =>
  cmd.dispense(well, volume, { labware: 'destPlateId' })

function tripleMix(well: string, volume: number, labware: string) {
  const params = { labware }
  return [
    cmd.aspirate(well, volume, params),
    cmd.dispense(well, volume, params),
    cmd.aspirate(well, volume, params),
    cmd.dispense(well, volume, params),
    cmd.aspirate(well, volume, params),
    cmd.dispense(well, volume, params),
  ]
}

let invariantContext
let initialRobotState
let robotInitialStateNoLiquidState
let robotStatePickedUpOneTipNoLiquidState
let robotStatePickedUpMultiTipsNoLiquidState
let robotStatePickedUpOneTip

beforeEach(() => {
  // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
  // NOTE: this one is different, has "...NoLiquidState" versions, and "PickedUpOneTip" with the A1 missing from rack and added to pipette
  invariantContext = makeContext()
  const makeStateArgs = {
    invariantContext,
    pipetteLocations: {
      p300SingleId: { mount: 'left' },
      p300MultiId: { mount: 'right' },
    },
    labwareLocations: {
      tiprack1Id: { slot: '1' },
      sourcePlateId: { slot: '2' },
      destPlateId: { slot: '3' },
      trashId: { slot: '12' },
    },
  }
  initialRobotState = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: true },
  })

  robotInitialStateNoLiquidState = omit(
    cloneDeep(initialRobotState),
    'liquidState'
  )

  robotStatePickedUpOneTip = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: true },
  })
  robotStatePickedUpOneTip.tipState.pipettes.p300SingleId = true
  robotStatePickedUpOneTip.tipState.tipracks.tiprack1Id.A1 = false

  robotStatePickedUpOneTipNoLiquidState = omit(
    cloneDeep(robotStatePickedUpOneTip),
    'liquidState'
  )

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
})

describe('consolidate single-channel', () => {
  const baseData = {
    stepType: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: 'p300SingleId',

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'B1',
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    // volume and changeTip should be explicit in tests

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }

  test('Minimal single-channel: A1 A2 to B1, 50uL with p300', () => {
    const data = {
      ...baseData,
      sourceWells: ['A1', 'A2'],
      volume: 50,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.robotState).toMatchObject(robotStatePickedUpOneTip)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 50),
      cmd.aspirate('A2', 50),
      dispense('B1', 100),
    ])
  })

  test('Single-channel with exceeding pipette max: A1 A2 A3 A4 to B1, 150uL with p300', () => {
    // TODO Ian 2018-05-03 is this a duplicate of exceeding max with changeTip="once"???
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),
      dispense('B1', 300),

      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),
      dispense('B1', 300),
    ])

    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('Single-channel with exceeding pipette max: with changeTip="always"', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'always',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),
      dispense('B1', 300),
      cmd.dropTip('A1'),

      cmd.pickUpTip('B1'),
      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),
      dispense('B1', 300),
    ])

    expect(result.robotState).toMatchObject({
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
      ...baseData,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),
      dispense('B1', 300),

      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),
      dispense('B1', 300),
    ])

    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('Single-channel with exceeding pipette max: with changeTip="never"', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'never',
    }

    const result = consolidate(data)(invariantContext, robotStatePickedUpOneTip)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),
      dispense('B1', 300),

      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),
      dispense('B1', 300),
    ])

    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('mix on aspirate should mix before aspirate in first well of chunk only', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      ...tripleMix('A1', 50, 'sourcePlateId'),

      cmd.aspirate('A1', 100),
      cmd.aspirate('A2', 100),
      cmd.aspirate('A3', 100),
      dispense('B1', 300),

      ...tripleMix('A4', 50, 'sourcePlateId'),

      cmd.aspirate('A4', 100),
      dispense('B1', 100),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('mix on aspirate', () => {
    const data = {
      ...baseData,
      volume: 125,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      // Start mix
      cmd.aspirate('A1', 50),
      cmd.dispense('A1', 50), // sourceLabwareId
      cmd.aspirate('A1', 50),
      cmd.dispense('A1', 50), // sourceLabwareId
      cmd.aspirate('A1', 50),
      cmd.dispense('A1', 50), // sourceLabwareId
      // done mix
      cmd.aspirate('A1', 125),
      cmd.aspirate('A2', 125),
      dispense('B1', 250),

      // Start mix
      cmd.aspirate('A3', 50),
      cmd.dispense('A3', 50), // sourceLabwareId
      cmd.aspirate('A3', 50),
      cmd.dispense('A3', 50), // sourceLabwareId
      cmd.aspirate('A3', 50),
      cmd.dispense('A3', 50), // sourceLabwareId
      // done mix

      cmd.aspirate('A3', 125),
      cmd.aspirate('A4', 125),
      dispense('B1', 250),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('mix after dispense', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 53 },
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 100),
      cmd.aspirate('A2', 100),
      cmd.aspirate('A3', 100),
      dispense('B1', 300),

      ...tripleMix('B1', 53, 'destPlateId'),

      cmd.aspirate('A4', 100),
      dispense('B1', 100),

      ...tripleMix('B1', 53, 'destPlateId'),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('mix after dispense with blowout to trash: first mix, then blowout', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 54 },
      blowoutLocation: 'trashId',
    }

    const result = consolidate(data)(invariantContext, initialRobotState)
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 100),
      cmd.aspirate('A2', 100),
      cmd.aspirate('A3', 100),
      dispense('B1', 300),

      ...tripleMix('B1', 54, 'destPlateId'),

      cmd.blowout(),
      cmd.aspirate('A4', 100),
      dispense('B1', 100),

      ...tripleMix('B1', 54, 'destPlateId'),

      cmd.blowout(),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('"pre-wet tip" should aspirate and dispense consolidate volume from first well of each chunk', () => {
    // TODO LATER Ian 2018-02-13 Should it be 2/3 max volume instead?
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      preWetTip: true,
      sourceWells: ['A1', 'A2', 'A3', 'A4'],
    }

    const preWetVol = data.volume // NOTE same as volume above... for now

    const result = consolidate(data)(invariantContext, initialRobotState)
    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      // pre-wet tip
      cmd.aspirate('A1', preWetVol),
      cmd.dispense('A1', preWetVol),
      // done pre-wet

      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),
      dispense('B1', 300),

      // pre-wet tip, now with A3
      cmd.aspirate('A3', preWetVol),
      cmd.dispense('A3', preWetVol),
      // done pre-wet

      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),
      dispense('B1', 300),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('touch-tip after aspirate should touch tip after every aspirate command', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      touchTipAfterAspirate: true,
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 150),
      cmd.touchTip('A1'),

      cmd.aspirate('A2', 150),
      cmd.touchTip('A2'),

      dispense('B1', 300),

      cmd.aspirate('A3', 150),
      cmd.touchTip('A3'),

      cmd.aspirate('A4', 150),
      cmd.touchTip('A4'),

      dispense('B1', 300),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('touch-tip after dispense should touch tip after dispense on destination well', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      touchTipAfterDispense: true,
    }

    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 150),
      cmd.aspirate('A2', 150),

      dispense('B1', 300),
      cmd.touchTip('B1', { labware: 'destPlateId' }),

      cmd.aspirate('A3', 150),
      cmd.aspirate('A4', 150),

      dispense('B1', 300),
      cmd.touchTip('B1', { labware: 'destPlateId' }),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpOneTipNoLiquidState
    )
  })

  test('invalid pipette ID should return error', () => {
    const data = {
      ...baseData,
      sourceWells: ['A1', 'A2'],
      volume: 150,
      changeTip: 'once',
      pipette: 'no-such-pipette-id-here',
    }

    const result = consolidateWithErrors(data)(
      invariantContext,
      initialRobotState
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].type).toEqual('PIPETTE_DOES_NOT_EXIST')
  })

  test.skip('air gap', () => {}) // TODO Ian 2018-04-05 determine air gap behavior
})

describe('consolidate multi-channel', () => {
  const multiParams = { pipette: 'p300MultiId' }
  const multiDispense = (well: string, volume: number) =>
    cmd.dispense(well, volume, {
      labware: 'destPlateId',
      pipette: 'p300MultiId',
    })

  const baseData = {
    stepType: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: 'p300MultiId',

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'A12',
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    // volume and changeTip should be explicit in tests

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }

  test('simple multi-channel: cols A1 A2 A3 A4 to col A12', () => {
    const data = {
      ...baseData,
      volume: 140,
      changeTip: 'once',
    }
    const result = consolidate(data)(invariantContext, initialRobotState)

    expect(result.commands).toEqual([
      cmd.pickUpTip('A1', multiParams),
      cmd.aspirate('A1', 140, multiParams),
      cmd.aspirate('A2', 140, multiParams),
      multiDispense('A12', 280),

      cmd.aspirate('A3', 140, multiParams),
      cmd.aspirate('A4', 140, multiParams),
      multiDispense('A12', 280),
    ])
    expect(result.robotState).toMatchObject(
      robotStatePickedUpMultiTipsNoLiquidState
    )
  })

  // TODO Ian 2018-03-14: address different multi-channel layouts of plates
  test.skip('multi-channel 384 plate: cols A1 B1 A2 B2 to 96-plate col A12', () => {})

  test.skip('multi-channel trough A1 A2 A3 A4 to 96-plate A12', () => {})
})
