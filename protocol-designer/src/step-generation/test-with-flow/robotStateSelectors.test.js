// @flow
import {filledTiprackWells, p300Single} from './fixtures'
import {sortLabwareBySlot, getNextTiprack, _getNextTip} from '../'

describe('sortLabwareBySlot', () => {
  test('sorts all labware by slot', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        six: {
          slot: '6',
          type: '96-flat',
          name: 'Destination Plate'
        },
        one: {
          slot: '1',
          type: 'tiprack-200uL',
          name: 'Tip rack'
        },
        eleven: {
          slot: '11',
          type: 'tiprack-200uL',
          name: 'Tip rack'
        },
        two: {
          slot: '2',
          type: 'trough-12row',
          name: 'Source (Buffer)'
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
    expect(sortLabwareBySlot(robotState)).toEqual(['one', 'two', 'six', 'eleven'])
  })

  test('with no labware, return empty array', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {},
      tipState: {
        tipracks: {
          tiprack1Id: {...filledTiprackWells}
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }
    expect(sortLabwareBySlot(robotState)).toEqual([])
  })
})

describe('_getNextTip', () => {
  test('full tiprack should start at A1', () => {
    const result = _getNextTip(1, {...filledTiprackWells})
    expect(result).toEqual('A1')
  })

  test('missing A1, go to B1', () => {
    const result = _getNextTip(1, {...filledTiprackWells, A1: false})
    expect(result).toEqual('B1')
  })

  test('missing A1 and B1, go to C1', () => {
    const result = _getNextTip(1, {...filledTiprackWells, A1: false, B1: false})
    expect(result).toEqual('C1')
  })

  test('missing first column, go to A2', () => {
    const result = _getNextTip(1, {
      ...filledTiprackWells,
      A1: false,
      B1: false,
      C1: false,
      D1: false,
      E1: false,
      F1: false,
      G1: false,
      H1: false
    })
    expect(result).toEqual('A2')
  })

  test('missing a few random tips, go to lowest col, then lowest row', () => {
    const result = _getNextTip(1, {
      ...filledTiprackWells,
      A1: false,
      B1: false,
      C1: false,
      D1: false,
      E1: false,
      F1: false,
      G1: false,
      H1: false,

      A2: false,
      B2: false,
      C2: false,
      D2: true,
      E2: false,
      F2: false,
      G2: false,
      H2: false
    })
    expect(result).toEqual('D2')
  })
})

describe('getNextTiprack - single-channel', () => {
  test('single tiprack, missing A1', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
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
          tiprack2Id: {
            ...filledTiprackWells,
            A1: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(1, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('B1')
  })

  test('single tiprack, empty, should return null', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
        tipracks: {},
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(1, robotState)

    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        tiprack11Id: {
          slot: '11',
          type: 'tiprack-200uL',
          name: 'Tip rack 11'
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells
          },
          tiprack11Id: {
            ...filledTiprackWells
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(1, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        tiprack11Id: {
          slot: '11',
          type: 'tiprack-200uL',
          name: 'Tip rack 11'
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells,
            A1: false
          },
          tiprack11Id: {
            ...filledTiprackWells,
            A1: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(1, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('B1')
  })

  test('multiple tipracks, all empty, should return null', () => {
  })
})

describe('getNextTiprack - 8-channel', () => {
  test('single tiprack, totally full', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {...filledTiprackWells}
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('single tiprack, partially full', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells,
            A1: false,
            A2: false,
            A5: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A3')
  })

  test('single tiprack, empty, should return null', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
        tipracks: {},
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result).toEqual(null)
  })

  test('single tiprack, a well missing from each column, should return null', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells,
            F1: false,
            B2: false,
            C3: false,
            A4: false,
            H5: false,
            E6: false,
            B7: false,
            A8: false,
            C9: false,
            D10: false,
            G11: false,
            F12: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        tiprack3Id: {
          slot: '3',
          type: 'tiprack-200uL',
          name: 'Tip rack 3'
        },
        tiprack10Id: {
          slot: '10',
          type: 'tiprack-200uL',
          name: 'Tip rack 10'
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells
          },
          tiprack3Id: {
            ...filledTiprackWells
          },
          tiprack10Id: {
            ...filledTiprackWells
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        tiprack3Id: {
          slot: '3',
          type: 'tiprack-200uL',
          name: 'Tip rack 3'
        },
        tiprack10Id: {
          slot: '10',
          type: 'tiprack-200uL',
          name: 'Tip rack 10'
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells,
            F1: false,
            B2: false,
            C3: false,
            A4: false,
            H5: false,
            E6: false,
            B7: false,
            A8: false,
            C9: false,
            D10: false,
            G11: false,
            F12: false
          },
          tiprack3Id: {
            ...filledTiprackWells,
            A1: false,
            A2: false,
            A3: false,
            A4: false,
            A5: false,
            A6: false,
            A7: false,
            A8: false,
            A9: false,
            A10: false,
            A11: false,
            A12: false
          },
          tiprack10Id: {
            ...filledTiprackWells,
            A1: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result && result.tiprackId).toEqual('tiprack10Id')
    expect(result && result.well).toEqual('A2')
  })

  test('multiple tipracks, all empty, should return null', () => {
    const robotState = {
      instruments: {
        p300SingleId: p300Single
      },
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'tiprack-200uL',
          name: 'Tip rack 2'
        },
        tiprack3Id: {
          slot: '3',
          type: 'tiprack-200uL',
          name: 'Tip rack 3'
        },
        tiprack10Id: {
          slot: '10',
          type: 'tiprack-200uL',
          name: 'Tip rack 10'
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
          name: 'Source (Buffer)'
        },
        destPlateId: {
          slot: '1',
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
          tiprack2Id: {
            ...filledTiprackWells,
            F1: false,
            B2: false,
            C3: false,
            A4: false,
            H5: false,
            E6: false,
            B7: false,
            A8: false,
            C9: false,
            D10: false,
            G11: false,
            F12: false
          },
          tiprack3Id: {
            ...filledTiprackWells,
            A1: false,
            A2: false,
            A3: false,
            A4: false,
            A5: false,
            A6: false,
            A7: false,
            A8: false,
            A9: false,
            A10: false,
            A11: false,
            A12: false
          },
          tiprack10Id: {
            ...filledTiprackWells,
            A1: false,
            A2: false,
            A3: false,
            A4: false,
            A5: false,
            A6: false,
            A7: false,
            A8: false,
            A9: false,
            A10: false,
            A11: false,
            A12: false
          }
        },
        pipettes: {
          p300SingleId: false
        }
      }
    }

    const result = getNextTiprack(8, robotState)

    expect(result).toEqual(null)
  })
})
