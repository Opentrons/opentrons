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
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
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
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'trashId',
        well: 'A1'
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
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 30,
        labware: 'trashId',
        well: 'A1'
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
        volume: 200,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        // Trash the disposal volume
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 30,
        labware: 'trashId',
        well: 'A1'
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

  test.skip('mix after dispense with disposal volume: dispose, then mix (?)', () => {
    // TODO Ian 2018-02-13 should the mixing happen after disposing?
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      disposalVolume: 30,
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
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 30,
        labware: 'trashId',
        well: 'A1'
      },
      // Now, mix in the dest well
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'aspirate',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      },
      {
        command: 'dispense',
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'destPlateId',
        well: 'B1'
      }
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  test('"pre-wet tip" should aspirate and dispense 2/3 pipette max volume from first well (?)', () => {
    // TODO Ian 2018-02-13 Should it be transfer volume instead?
    // TODO IMMEDIATELY what happens when you are reusing tips or replacing tips across chunks?
    const data = {
      ...baseData,
      volume: 100,
      changeTip: 'once',
      preWetTip: true,
      sourceWells: ['A1', 'A2']
    }

    const preWetVol = 200

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
      // pre-wet tip
      // done pre-wet
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
      }
    ])
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

})

describe('consolidate multi-channel', () => {
  const robotInitialState = getBasicRobotState()

  const robotStatePickedUpOneTip = {
    ...robotInitialState,
    tipState: {
      tipracks: {
        ...robotInitialState.tipState.tipracks,
        tiprack1Id: {...filledTiprackWells, A1: false, B1: false, C1: false, D1: false, E1: false, F1: false, G1: false, H1: false}
      },
      pipettes: {
        ...robotInitialState.tipState.pipettes,
        p300MultiId: true
      }
    }
  }

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
    expect(result.robotState).toEqual(robotStatePickedUpOneTip)
  })

  // TODO later: address different multi-channel layouts of plates?
  test.skip('multi-channel 384 plate: cols A1 B1 A2 B2 to 96-plate col A12')

  test.skip('multi-channel trough A1 A2 A3 A4 to 96-plate A12')
})
