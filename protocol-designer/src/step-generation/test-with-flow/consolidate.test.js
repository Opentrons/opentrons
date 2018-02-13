// @flow
import {getBasicRobotState, filledTiprackWells} from './fixtures'
import {consolidate} from '../'

describe('consolidate single-channel', () => {
  const robotInitialState = getBasicRobotState()

  const robotStatePickedUpOneTip = {
    ...robotInitialState,
    tipState: {
      tipracks: {
        ...robotInitialState.tipState.tipracks,
        tiprack1Id: {...filledTiprackWells, A1: false}
      },
      pipettes: {
        ...robotInitialState.tipState.pipettes,
        p300SingleId: true
      }
    }
  }

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
      volume: 50,
      changeTip: 'once'
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)

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

    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
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

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {...filledTiprackWells, A1: null, B1: null}
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

      changeTip: 'once',
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

    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
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

    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
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
        volume: 250,
        labware: 'destPlateId',
        well: 'B1'
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
        volume: 250,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test('mix on aspirate should mix before aspirate in first well of chunk only', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixFirstAspirate: {times: 3, ul: 50}
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
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 100,
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
      }
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test('mix on aspirate with disposal vol', () => {
    const data = {
      ...baseData,
      volume: 100,
      disposalVolume: 30,
      changeTip: 'once',
      mixFirstAspirate: {times: 3, ul: 50}
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
        volume: 130, // with disposal vol
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
        volume: 230,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 130, // with disposal volume
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
        volume: 230,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test('mix after dispense', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: {times: 3, ul: 50}
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
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
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
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'B1'
      }
      // done mix 2
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test('mix after dispense with blowout to trash', () => {
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      mixInDestination: {times: 3, ul: 50},
      blowout: 'trashId'
    }

    throw new Error('TODO')
    // const result = consolidate(data)(robotInitialState)
    // expect(result.commands).toEqual([
    //   // TODO IMMEDIATELY
    // ])
    // expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test.skip('mix after dispense with disposal volume -- ?should this throw error?', () => { // TODO IMMEDIATELY
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      disposalVolume: 30,
      mixInDestination: {times: 3, ul: 50}
    }

    const result = consolidate(data)(robotInitialState)
    throw new Error('TODO')
    // expect(result.commands).toEqual([
    //   // TODO IMMEDIATELY
    // ])
    // expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test.skip('pre-wet tip should aspirate and dispense ??? volume TODO', () => {}) // TODO IMMEDIATELY

})

describe.skip('consolidate multi-channel', () => { // TODO don't skip
  test('simple multi-channel 96 plate: cols A1 A2 A3 A4 to col A12', () => {
    throw new Error('TODO')
  })

  test('multi-channel 384 plate: cols A1 A2 A3 A4 to col A12', () => {
    throw new Error('TODO')
  })

  test('multi-channel trough A1 A2 A3 A4 to A12', () => {
    throw new Error('TODO')
  })

  test('invalid wells')
})
