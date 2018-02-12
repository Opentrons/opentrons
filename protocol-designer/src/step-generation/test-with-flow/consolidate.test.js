// @flow
import {getBasicRobotState, filledTiprackWells} from './fixtures'
import {consolidate} from '../'

describe('consolidate single-channel', () => {
  const robotInitialState = getBasicRobotState()

  test('Minimal single-channel: A1 A2 to B1, 50uL with p300', () => {
    const data = {
      stepType: 'consolidate',
      name: 'Consolidate Test',
      description: 'test blah blah',
      pipette: 'p300SingleId',

      sourceWells: ['A1', 'A2'],
      destWell: 'B1',
      sourceLabware: 'sourcePlateId',
      destLabware: 'destPlateId',
      volume: 50,

      changeTip: 'once',

      preWetTip: false,
      touchTipAfterAspirate: false,
      airGap: false,
      disposalVolume: false,
      mixInDestination: false,
      delayAfterDispense: false,
      blowOut: false
    }

    const result = consolidate(data)(robotInitialState)
    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        ...robotInitialState.tipState,
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {...filledTiprackWells, A1: false}
        },
        pipettes: {
          ...robotInitialState.tipState.pipettes,
          p300SingleId: true
        }
      }
    })

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
      stepType: 'consolidate',
      name: 'Consolidate Test',
      description: 'test blah blah',
      pipette: 'p300SingleId',

      sourceWells: ['A1', 'A2', 'A3', 'A4'],
      destWell: 'B1',
      sourceLabware: 'sourcePlateId',
      destLabware: 'destPlateId',
      volume: 150,
      changeTip: 'once',

      preWetTip: false,
      touchTipAfterAspirate: false,
      airGap: false,
      disposalVolume: false,
      mixInDestination: false,
      delayAfterDispense: false,
      blowOut: false
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

    expect(result.robotState).toEqual({
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
    })
  })

  test('Single-channel with exceeding pipette max: with changeTip="always"', () => {
    const data = {
      stepType: 'consolidate',
      name: 'Consolidate Test',
      description: 'test blah blah',
      pipette: 'p300SingleId',

      sourceWells: ['A1', 'A2', 'A3', 'A4'],
      destWell: 'B1',
      sourceLabware: 'sourcePlateId',
      destLabware: 'destPlateId',
      volume: 150,

      changeTip: 'always',

      preWetTip: false,
      touchTipAfterAspirate: false,
      airGap: false,
      disposalVolume: false,
      mixInDestination: false,
      delayAfterDispense: false,
      blowOut: false
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
          tiprack1Id: {...filledTiprackWells, A1: false, B1: false}
        },
        pipettes: {
          ...robotInitialState.tipState.pipettes,
          p300SingleId: true
        }
      }
    })
  })
})

describe.skip('consolidate multi-channel', () => { // TODO don't skip
})
