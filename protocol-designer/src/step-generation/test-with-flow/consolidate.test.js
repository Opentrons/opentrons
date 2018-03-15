// @flow
import merge from 'lodash/merge'
import {createRobotStateFixture, createEmptyLiquidState, getTipColumn, getTiprackTipstate} from './fixtures'
import {consolidate} from '../'

const robotInitialStateNoLiquidState = createRobotStateFixture({
  sourcePlateType: 'trough-12row',
  destPlateType: '96-flat',
  fillTiprackTips: true,
  fillPipetteTips: false,
  tipracks: [200, 200]
})

const emptyLiquidState = createEmptyLiquidState({
  sourcePlateType: 'trough-12row',
  destPlateType: '96-flat',
  pipettes: robotInitialStateNoLiquidState.instruments
})

const robotStatePickedUpOneTipNoLiquidState = merge(
  {},
  robotInitialStateNoLiquidState,
  {
    tipState: {
      tipracks: {
        tiprack1Id: {A1: false}
      },
      pipettes: {
        p300SingleId: true
      }
    }
  }
)

const robotStatePickedUpMultiTipsNoLiquidState = merge(
  {},
  robotInitialStateNoLiquidState,
  {
    tipState: {
      tipracks: {
        tiprack1Id: getTipColumn(1, false)
      },
      pipettes: {
        p300MultiId: true
      }
    }
  }
)

// Fixtures with empty liquidState
const robotInitialState = {...robotInitialStateNoLiquidState, liquidState: emptyLiquidState}
const robotStatePickedUpOneTip = {...robotStatePickedUpOneTipNoLiquidState, liquidState: emptyLiquidState}

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
    disposalVolume: null,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    delayAfterDispense: null,
    blowout: null
  }

  test('Minimal single-channel: A1 A2 to B1, 50uL with p300', () => {
    const data = {
      ...baseData,
      sourceWells: ['A1', 'A2'],
      volume: 50,
      changeTip: 'once'
    }

    const result = consolidate(data)(robotInitialState)

    expect(result.robotState).toMatchObject(robotStatePickedUpOneTip)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
  })

  test('Single-channel with exceeding pipette max: A1 A2 A3 A4 to B1, 150uL with p300', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once'
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])

    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('Single-channel with exceeding pipette max: with changeTip="always"', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'always'
    }

    const result = consolidate(data)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'drop-tip',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])

    expect(result.robotState).toMatchObject({
      ...robotInitialStateNoLiquidState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {...getTiprackTipstate(true), A1: false, B1: false}
        },
        pipettes: {
          ...robotInitialState.tipState.pipettes,
          p300SingleId: true
        }
      }
    })
  })

  test('Single-channel with exceeding pipette max: with changeTip="once"', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once'
    }

    const result = consolidate(data)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])

    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('Single-channel with exceeding pipette max: with changeTip="never"', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'never'
    }

    const result = consolidate(data)(robotStatePickedUpOneTip)

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])

    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('disposal vol should be taken from first well', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      disposalVolume: 50
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150, // disposalVolume included
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150, // disposalVolume included
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix on aspirate should mix before aspirate in first well of chunk only', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixFirstAspirate: {times: 3, volume: 50}
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      // done mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      // done mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix on aspirate with disposal vol', () => {
    const data = {
      ...baseData,
      volume: 125,
      disposalVolume: 30,
      changeTip: 'once',
      mixFirstAspirate: {times: 3, volume: 50}
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      // done mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 155, // with disposal vol
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 125,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 250,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      // done mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 155, // with disposal volume
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 125,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 250,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix after dispense', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: {times: 3, volume: 53}
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      // done mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'destPlateId',
        well: 'B1'
      },
      // Start mix 2
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 53,
        labware: 'destPlateId',
        well: 'B1'
      }
      // done mix 2
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix after dispense with blowout to trash: first mix, then blowout', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: {times: 3, volume: 54},
      blowout: 'trashId'
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      // Start mix
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      // done mix
      {
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'destPlateId',
        well: 'B1'
      },
      // Start mix 2
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 54,
        labware: 'destPlateId',
        well: 'B1'
      },
      // done mix 2
      {
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('mix after dispense with disposal volume: dispose, then mix (?)', () => {
    // TODO Ian 2018-02-13 should the mixing happen after disposing? Or should this behavior be different?
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      disposalVolume: 30,
      mixInDestination: {times: 3, volume: 52}
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 130, // includes disposal volume
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      // Now, mix in the dest well
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      // done mixing
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 130, // includes disposal volume
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'blowout',
        pipette: 'p300SingleId',
        labware: 'trashId',
        well: 'A1'
      },
      // Now, mix in the dest well
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 52,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('"pre-wet tip" should aspirate and dispense consolidate volume from first well of each chunk', () => {
    // TODO LATER Ian 2018-02-13 Should it be 2/3 max volume instead?
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      preWetTip: true,
      sourceWells: ['A1', 'A2', 'A3', 'A4']
    }

    const preWetVol = data.volume // NOTE same as volume above... for now

    const result = consolidate(data)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      // pre-wet tip
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: preWetVol,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: preWetVol,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      // done pre-wet
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      // pre-wet tip, now with A3
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: preWetVol,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: preWetVol,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      // done pre-wet
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('touch-tip after aspirate should touch tip after every aspirate command', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      touchTipAfterAspirate: true
    }

    const result = consolidate(data)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })

  test('touch-tip after dispense should touch tip after dispense on destination well', () => {
    const data = {
      ...baseData,
      volume: 150,
      changeTip: 'once',
      touchTipAfterDispense: true
    }

    const result = consolidate(data)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 150,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 300,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpOneTipNoLiquidState)
  })
})

describe('consolidate multi-channel', () => {
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
    disposalVolume: null,
    mixFirstAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    delayAfterDispense: null,
    blowout: null
  }

  test('simple multi-channel: cols A1 A2 A3 A4 to col A12', () => {
    const data = {
      ...baseData,
      volume: 140,
      changeTip: 'once'
    }
    const result = consolidate(data)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300MultiId',
        labware: 'tiprack1Id',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300MultiId',
        volume: 140,
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        command: 'aspirate',
        pipette: 'p300MultiId',
        volume: 140,
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        command: 'dispense',
        pipette: 'p300MultiId',
        volume: 280,
        labware: 'destPlateId',
        well: 'A12'
      },
      {
        command: 'aspirate',
        pipette: 'p300MultiId',
        volume: 140,
        labware: 'sourcePlateId',
        well: 'A3'
      },
      {
        command: 'aspirate',
        pipette: 'p300MultiId',
        volume: 140,
        labware: 'sourcePlateId',
        well: 'A4'
      },
      {
        command: 'dispense',
        pipette: 'p300MultiId',
        volume: 280,
        labware: 'destPlateId',
        well: 'A12'
      }
    ])
    expect(result.robotState).toMatchObject(robotStatePickedUpMultiTipsNoLiquidState)
  })

  // TODO Ian 2018-03-14: address different multi-channel layouts of plates
  test.skip('multi-channel 384 plate: cols A1 B1 A2 B2 to 96-plate col A12')

  test.skip('multi-channel trough A1 A2 A3 A4 to 96-plate A12')
})
