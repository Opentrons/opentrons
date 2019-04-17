// @flow
import {
  makeContext,
  makeState,
  getTipColumn,
  getTiprackTipstate,
} from './fixtures'
import { sortLabwareBySlot, getNextTiprack, _getNextTip } from '../'

let invariantContext

beforeEach(() => {
  invariantContext = makeContext()
})

describe('sortLabwareBySlot', () => {
  test('sorts all labware by slot', () => {
    const labwareState = {
      six: {
        slot: '6',
      },
      one: {
        slot: '1',
      },
      eleven: {
        slot: '11',
      },
      two: {
        slot: '2',
      },
    }
    expect(sortLabwareBySlot(labwareState)).toEqual([
      'one',
      'two',
      'six',
      'eleven',
    ])
  })

  test('with no labware, return empty array', () => {
    const labwareState = {}
    expect(sortLabwareBySlot(labwareState)).toEqual([])
  })
})

describe('_getNextTip', () => {
  test('empty tiprack should return null', () => {
    const channels = [1, 8]
    channels.forEach(channel => {
      const result = _getNextTip(channel, { ...getTiprackTipstate(false) })
      expect(result).toBe(null)
    })
  })

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
    const robotState = makeState({
      invariantContext,
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        sourcePlateId: { slot: '2' },
      },
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      tiprackSetting: { tiprack1Id: true },
    })

    robotState.tipState.tipracks.tiprack1Id.A1 = false

    const result = getNextTiprack('p300SingleId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('B1')
  })

  test('single tiprack, empty, should return null', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: { tiprack1Id: { slot: '1' } },
      tiprackSetting: { tiprack1Id: false },
    })

    const result = getNextTiprack('p300SingleId', invariantContext, robotState)
    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
    })
    const result = getNextTiprack('p300SingleId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
    })
    // remove A1 tip from both racks
    robotState.tipState.tipracks.tiprack1Id.A1 = false
    robotState.tipState.tipracks.tiprack2Id.A1 = false
    const result = getNextTiprack('p300SingleId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('B1')
  })

  test('multiple tipracks, all empty, should return null', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: false, tiprack2Id: false },
    })
    const result = getNextTiprack('p300SingleId', invariantContext, robotState)

    expect(result).toBe(null)
  })
})

describe('getNextTiprack - 8-channel', () => {
  test('single tiprack, totally full', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
      },
      tiprackSetting: { tiprack1Id: true },
    })

    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A1')
  })

  test('single tiprack, partially full', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: true },
    })
    robotState.tipState.tipracks.tiprack1Id = {
      ...robotState.tipState.tipracks.tiprack1Id,
      A1: false,
      A2: false,
      A5: false,
    }
    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A3')
  })

  test('single tiprack, empty, should return null', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: false },
    })
    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result).toEqual(null)
  })

  test('single tiprack, a well missing from each column, should return null', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: true },
    })
    robotState.tipState.tipracks.tiprack1Id = {
      ...robotState.tipState.tipracks.tiprack1Id,
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
    }

    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result).toEqual(null)
  })

  test('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
        tiprack2Id: { slot: '3' },
        tiprack3Id: { slot: '10' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true, tiprack3Id: true },
    })
    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A1')
  })

  test('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        tiprack2Id: { slot: '2' },
        tiprack3Id: { slot: '3' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true, tiprack3Id: true },
    })
    // remove tips from state
    robotState.tipState.tipracks.tiprack1Id = {
      ...robotState.tipState.tipracks.tiprack1Id,
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
    }
    robotState.tipState.tipracks.tiprack2Id = {
      ...robotState.tipState.tipracks.tiprack2Id,
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
    }
    robotState.tipState.tipracks.tiprack3Id = {
      ...robotState.tipState.tipracks.tiprack3Id,
      A1: false,
    }

    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack3Id')
    expect(result && result.well).toEqual('A2')
  })

  test('multiple tipracks, all empty, should return null', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        tiprack2Id: { slot: '2' },
        tiprack3Id: { slot: '3' },
      },
      tiprackSetting: {
        tiprack1Id: false,
        tiprack2Id: false,
        tiprack3Id: false,
      },
    })
    const result = getNextTiprack('p300MultiId', invariantContext, robotState)
    expect(result).toEqual(null)
  })
})
