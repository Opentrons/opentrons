// @flow
import {pickUpTip} from '../'
import flatMap from 'lodash/flatMap'
import range from 'lodash/range'

const wellNames96 = flatMap(
  'ABCDEFGH'.split(''),
  (letter): Array<string> => range(12).map(number => letter + (number + 1))
)

const filledTiprackWells = wellNames96.reduce((acc, wellName) => ({...acc, [wellName]: true}), {})

describe('pickUpTip', () => {
  // TODO IMMEDIATELY proper fixture data passing around in jest
  const p300Single = {
    id: 'p300SingleId',
    mount: 'right',
    maxVolume: 300,
    channels: 1
  }

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

  test('Single-channel: first tip', () => {
    const result = pickUpTip('p300SingleId', robotInitialState)

    expect(result.nextCommands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'A1'
    }])

    expect(result.nextRobotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false
          }
        },
        pipettes: {
          p300SingleId: true
        }
      }
    })
  })

  test('Single-channel: second tip B1', () => {
    const result = pickUpTip('p300SingleId', {
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    })

    expect(result.nextCommands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'B1'
    }])

    expect(result.nextRobotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false,
            B1: false
          }
        },
        pipettes: {
          p300SingleId: true
        }
      }
    })
  })

  test('Single-channel: ninth tip (next column)', () => {
    const result = pickUpTip('p300SingleId', {
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false,
            B1: false,
            C1: false,
            D1: false,
            E1: false,
            F1: false,
            G1: false,
            H1: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    })

    expect(result.nextCommands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'A2'
    }])

    expect(result.nextRobotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false,
            B1: false,
            C1: false,
            D1: false,
            E1: false,
            F1: false,
            G1: false,
            H1: false
          }
        },
        pipettes: {
          p300SingleId: true
        }
      }
    })
  })

  test('Single-channel: pipette already has tip', () => {
    const robotState = {
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {...filledTiprackWells}
        },
        pipettes: {
          p300SingleId: true
        }
      }
    }

    const result = pickUpTip('p300SingleId', robotState)

    expect(result).toEqual({
      error: true,
      message: 'Pick up tip: Pipette "p300SingleId" already has a tip'
    })
  })
})
