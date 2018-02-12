// @flow
import {p300Single, filledTiprackWells} from './fixtures'
import {consolidate} from '../'

describe('consolidate single-channel', () => { // TODO don't skip
  const robotInitialState = {
    instruments: {
      p300SingleId: p300Single
    },
    labware: {
      tiprack1Id: {
        slot: '7',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      sourcePlateId: {
        slot: '10',
        type: 'trough-12row',
        name: 'Source (Buffer)'
      },
      destPlateId: {
        slot: '11',
        type: '96-flat',
        name: 'Destination Plate'
      },
      trashId: {
        slot: '12',
        type: 'fixed-trash',
        name: 'Trash'
      }
    },
    tipState: {
      tipracks: {
        tiprack1Id: {...filledTiprackWells}
      },
      pipettes: {
        p300SingleId: false
      }
    }
  }

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

    expect(consolidate(data, robotInitialState)).toEqual({
      annotation: {
        name: 'Consolidate Test',
        description: 'test blah blah'
      },
      commands: [
        {
          command: 'pick-up-tip', // TODO IMMEDIATELY need labware, tip, & instrument info
          pipette: 'pipette1Id',
          labware: 'tiprack1Id',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 50,
          labware: 'sourcePlateId',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 50,
          labware: 'sourcePlateId',
          well: 'A2'
        },
        {
          command: 'dispense',
          pipette: 'pipette1Id',
          volume: 100,
          labware: 'destPlateId',
          well: 'B1'
        }
      ]
    })
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

    expect(consolidate(data, robotInitialState)).toEqual({
      annotation: {
        name: 'Consolidate Test',
        description: 'test blah blah'
      },
      commands: [
        {
          command: 'pick-up-tip',
          pipette: 'pipette1Id',
          labware: 'tiprack1Id',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A2'
        },
        {
          command: 'dispense',
          pipette: 'pipette1Id',
          volume: 300,
          labware: 'destPlateId',
          well: 'B1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A3'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A4'
        },
        {
          command: 'dispense',
          pipette: 'pipette1Id',
          volume: 300,
          labware: 'destPlateId',
          well: 'B1'
        }
      ]
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

    expect(consolidate(data, robotInitialState)).toEqual({
      annotation: {
        name: 'Consolidate Test',
        description: 'test blah blah'
      },
      commands: [
        {
          command: 'pick-up-tip',
          pipette: 'pipette1Id',
          labware: 'tiprack1Id',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A1'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A2'
        },
        {
          command: 'dispense',
          pipette: 'pipette1Id',
          volume: 300,
          labware: 'destPlateId',
          well: 'B1'
        },
        {
          command: 'drop-tip',
          pipette: 'pipette1Id',
          labware: 'trashId',
          well: 'A1'
        },
        {
          command: 'pick-up-tip',
          pipette: 'pipette1Id',
          labware: 'tiprack1Id',
          well: 'A2'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A3'
        },
        {
          command: 'aspirate',
          pipette: 'pipette1Id',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A4'
        },
        {
          command: 'dispense',
          pipette: 'pipette1Id',
          volume: 300,
          labware: 'destPlateId',
          well: 'B1'
        }
      ]
    })
  })
})

describe.skip('consolidate multi-channel', () => { // TODO don't skip
})
