// @flow
import {filledTiprackWells, emptyTiprackWells, p300Single, p300Multi, basicLiquidState} from './fixtures'
import {replaceTip} from '../'

// TODO use a fixture, standardize
describe('replaceTip: single channel', () => {
  const robotInitialState = {
    instruments: {
      p300SingleId: p300Single
    },
    labware: {
      tiprack1Id: {
        slot: '1',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      tiprack10Id: {
        slot: '10',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      sourcePlateId: {
        slot: '11',
        type: 'trough-12row',
        name: 'Source (Buffer)'
      },
      destPlateId: {
        slot: '8',
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
        tiprack1Id: {...filledTiprackWells},
        tiprack10Id: {...filledTiprackWells}
      },
      pipettes: {
        p300SingleId: false
      }
    },
    liquidState: basicLiquidState
  }

  test('Single-channel: first tip', () => {
    const result = replaceTip('p300SingleId')(robotInitialState)

    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'A1'
    }])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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
    const result = replaceTip('p300SingleId')({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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

    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'B1'
    }])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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
    const result = replaceTip('p300SingleId')({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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

    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: 'A2'
    }])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false,
            B1: false,
            C1: false,
            D1: false,
            E1: false,
            F1: false,
            G1: false,
            H1: false,
            A2: false
          }
        },
        pipettes: {
          p300SingleId: true
        }
      }
    })
  })

  test('Single-channel: pipette already has tip, so tip will be replaced.', () => {
    const result = replaceTip('p300SingleId')({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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

    expect(result.commands).toEqual([
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
      }
    ])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
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

  test('Single-channel: used all tips in first rack, move to second rack', () => {
    const result = replaceTip('p300SingleId')({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {...emptyTiprackWells}
        },
        pipettes: {
          p300SingleId: false
        }
      }
    })

    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300SingleId',
      labware: 'tiprack10Id',
      well: 'A1'
    }])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          ...robotInitialState.tipState.tipracks,
          tiprack1Id: {
            ...emptyTiprackWells
          },
          tiprack10Id: {
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
})

describe('replaceTip: multi-channel', () => {
  // TODO use a fixture, standardize
  const robotInitialState = {
    instruments: {
      p300MultiId: p300Multi
    },
    labware: {
      tiprack1Id: {
        slot: '1',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      tiprack10Id: {
        slot: '10',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      sourcePlateId: {
        slot: '11',
        type: 'trough-12row',
        name: 'Source (Buffer)'
      },
      destPlateId: {
        slot: '8',
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
        tiprack1Id: {...filledTiprackWells},
        tiprack10Id: {...filledTiprackWells}
      },
      pipettes: {
        p300MultiId: false
      }
    },
    liquidState: basicLiquidState
  }

  test('multi-channel, all tipracks have tips', () => {
    const result = replaceTip('p300MultiId')(robotInitialState)

    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300MultiId',
      labware: 'tiprack1Id',
      well: 'A1'
    }])

    expect(result.robotState).toEqual({
      ...robotInitialState,
      tipState: {
        tipracks: {
          tiprack1Id: {...filledTiprackWells, A1: false, B1: false, C1: false, D1: false, E1: false, F1: false, G1: false, H1: false},
          tiprack10Id: {...filledTiprackWells}
        },
        pipettes: {
          p300MultiId: true
        }
      }
    })
  })

  test('multi-channel, missing tip in first row', () => {
    const robotStateWithTipA1Missing = {
      ...robotInitialState,
      tipState: {
        ...robotInitialState.tipState,
        tipracks: {
          tiprack1Id: {...filledTiprackWells, A1: false},
          tiprack10Id: {...filledTiprackWells}
        }
      }
    }

    const result = replaceTip('p300MultiId')(robotStateWithTipA1Missing)
    expect(result.commands).toEqual([{
      command: 'pick-up-tip',
      pipette: 'p300MultiId',
      labware: 'tiprack1Id',
      well: 'A2' // get from next row
    }])

    expect(result.robotState).toEqual({
      ...robotStateWithTipA1Missing,
      tipState: {
        ...robotStateWithTipA1Missing.tipState,
        tipracks: {
          tiprack1Id: {
            ...filledTiprackWells,
            A1: false,
            // Column 2 now empty
            A2: false,
            B2: false,
            C2: false,
            D2: false,
            E2: false,
            F2: false,
            G2: false,
            H2: false
          },
          tiprack10Id: {...filledTiprackWells}
        },
        pipettes: {
          p300MultiId: true
        }
      }
    })
  })

  test('Multi-channel: pipette already has tip, so tip will be replaced.', () => {
    const robotStateWithTipsOnMulti = {
      ...robotInitialState,
      tipState: {
        ...robotInitialState.tipState,
        pipettes: {
          p300MultiId: true
        }
      }
    }
    const result = replaceTip('p300MultiId')(robotStateWithTipsOnMulti)
    expect(result.commands).toEqual([
      {
        command: 'drop-tip',
        pipette: 'p300MultiId',
        labware: 'trashId',
        well: 'A1'
      },
      {
        command: 'pick-up-tip',
        pipette: 'p300MultiId',
        labware: 'tiprack1Id',
        well: 'A1' // get from next row
      }
    ])

    expect(result.robotState).toEqual({
      ...robotStateWithTipsOnMulti,
      tipState: {
        tipracks: {
          tiprack1Id: {...filledTiprackWells, A1: false, B1: false, C1: false, D1: false, E1: false, F1: false, G1: false, H1: false},
          tiprack10Id: {...filledTiprackWells}
        },
        pipettes: {
          p300MultiId: true
        }
      }
    })
  })
})
