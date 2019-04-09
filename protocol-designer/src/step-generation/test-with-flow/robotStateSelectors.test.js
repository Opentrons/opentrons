// @flow
import {
  p300Single,
  p300Multi,
  createEmptyLiquidState,
  getTiprackTipstate,
  getTipColumn,
} from './fixtures'
import { sortLabwareBySlot, getNextTiprack, _getNextTip } from '../'

// just a blank liquidState to appease flow
const basicLiquidState = {
  pipettes: {},
  labware: {},
}

let _pipettesState

beforeEach(() => {
  _pipettesState = {
    p300SingleId: p300Single,
    p300MultiId: p300Multi,
  }
})
describe('sortLabwareBySlot', () => {
  test('sorts all labware by slot', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        six: {
          slot: '6',
          type: '96-flat',
        },
        one: {
          slot: '1',
          type: 'opentrons-tiprack-300ul',
        },
        eleven: {
          slot: '11',
          type: 'opentrons-tiprack-300ul',
        },
        two: {
          slot: '2',
          type: 'trough-12row',
        },
      },
      tipState: {
        tipracks: {
          tiprack1Id: getTiprackTipstate(true),
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: createEmptyLiquidState({
        sourcePlateType: '96-flat',
        destPlateType: '96-flat',
        pipettes: _pipettesState,
      }),
    }
    expect(sortLabwareBySlot(robotState)).toEqual([
      'one',
      'two',
      'six',
      'eleven',
    ])
  })

  test('with no labware, return empty array', () => {
    const robotState = {
      pipettes: _pipettesState,
      labware: {},
      tipState: {
        tipracks: {
          tiprack1Id: getTiprackTipstate(true),
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: {
        pipettes: {},
        labware: {},
      },
    }
    expect(sortLabwareBySlot(robotState)).toEqual([])
  })
})

describe('_getNextTip', () => {
  test('full tiprack should start at A1', () => {
    const result = _getNextTip(1, { ...getTiprackTipstate(true) })
    expect(result).toEqual('A1')
  })

  test('missing A1, go to B1', () => {
    const result = _getNextTip(1, { ...getTiprackTipstate(true), A1: false })
    expect(result).toEqual('B1')
  })

  test('missing A1 and B1, go to C1', () => {
    const result = _getNextTip(1, {
      ...getTiprackTipstate(true),
      A1: false,
      B1: false,
    })
    expect(result).toEqual('C1')
  })

  test('missing first column, go to A2', () => {
    const result = _getNextTip(1, {
      ...getTiprackTipstate(true),
      ...getTipColumn(1, false),
    })
    expect(result).toEqual('A2')
  })

  test('missing a few random tips, go to lowest col, then lowest row', () => {
    const result = _getNextTip(1, {
      ...getTiprackTipstate(true),
      ...getTipColumn(1, false),
      ...getTipColumn(2, false),
      D2: true,
    })
    expect(result).toEqual('D2')
  })
})

describe('getNextTiprack - single-channel', () => {
  test('single tiprack, missing A1', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '11',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
            A1: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300SingleId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('B1')
  })

  test('single tiprack, empty, should return null', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: { ...getTiprackTipstate(false) },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300SingleId', robotState)

    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack11Id: {
          slot: '11',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
          },
          tiprack11Id: {
            ...getTiprackTipstate(true),
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300SingleId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack11Id: {
          slot: '11',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
            A1: false,
          },
          tiprack11Id: {
            ...getTiprackTipstate(true),
            A1: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300SingleId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('B1')
  })

  test('multiple tipracks, all empty, should return null', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack11Id: {
          slot: '11',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(false),
          },
          tiprack11Id: {
            ...getTiprackTipstate(false),
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300SingleId', robotState)

    expect(result).toBe(null)
  })
})

describe('getNextTiprack - 8-channel', () => {
  test('single tiprack, totally full', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: { ...getTiprackTipstate(true) },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('single tiprack, partially full', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
            A1: false,
            A2: false,
            A5: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A3')
  })

  test('single tiprack, empty, should return null', () => {
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: { ...getTiprackTipstate(false) },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result).toEqual(null)
  })

  test('single tiprack, a well missing from each column, should return null', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '10',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
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
            F12: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack3Id: {
          slot: '3',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack10Id: {
          slot: '10',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
          },
          tiprack3Id: {
            ...getTiprackTipstate(true),
          },
          tiprack10Id: {
            ...getTiprackTipstate(true),
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack2Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack3Id: {
          slot: '3',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack10Id: {
          slot: '10',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
            // empty diagonal, 8-channel cannot use
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
            F12: false,
          },
          tiprack3Id: {
            ...getTiprackTipstate(true),
            // empty row, 8-channel cannot use
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
            A12: false,
          },
          tiprack10Id: {
            ...getTiprackTipstate(true),
            A1: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result && result.tiprackId).toEqual('tiprack10Id')
    expect(result && result.well).toEqual('A2')
  })

  test('multiple tipracks, all empty, should return null', () => {
    // TODO use a fixture, standardize
    const robotState = {
      pipettes: _pipettesState,
      labware: {
        tiprack2Id: {
          slot: '2',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack3Id: {
          slot: '3',
          type: 'opentrons-tiprack-300ul',
        },
        tiprack10Id: {
          slot: '10',
          type: 'opentrons-tiprack-300ul',
        },
        sourcePlateId: {
          slot: '9',
          type: 'trough-12row',
        },
        destPlateId: {
          slot: '1',
          type: '96-flat',
        },
        trashId: {
          slot: '12',
          type: 'fixed-trash',
        },
      },
      tipState: {
        tipracks: {
          tiprack2Id: {
            ...getTiprackTipstate(true),
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
            F12: false,
          },
          tiprack3Id: {
            ...getTiprackTipstate(true),
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
            A12: false,
          },
          tiprack10Id: {
            ...getTiprackTipstate(true),
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
            A12: false,
          },
        },
        pipettes: {
          p300SingleId: false,
        },
      },
      liquidState: basicLiquidState,
    }

    const result = getNextTiprack('p300MultiId', robotState)

    expect(result).toEqual(null)
  })
})
