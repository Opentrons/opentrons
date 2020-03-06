// @flow
import { getLabwareDefURI, MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  makeContext,
  makeState,
  getTipColumn,
  getTiprackTipstate,
  DEFAULT_PIPETTE,
} from '../__fixtures__'
import {
  sortLabwareBySlot,
  getNextTiprack,
  _getNextTip,
  getModuleState,
} from '../'
let invariantContext

beforeEach(() => {
  invariantContext = makeContext()
})

describe('sortLabwareBySlot', () => {
  it('sorts all labware by slot', () => {
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

  it('with no labware, return empty array', () => {
    const labwareState = {}
    expect(sortLabwareBySlot(labwareState)).toEqual([])
  })
})

describe('_getNextTip', () => {
  const getNextTipHelper = (
    channel: 1 | 8,
    tiprackTipState: { [well: string]: boolean }
  ) => {
    const pipetteId = channel === 1 ? DEFAULT_PIPETTE : 'p300MultiId'
    const tiprackId = 'testTiprack'
    let _invariantContext = makeContext()
    _invariantContext.labwareEntities[tiprackId] = {
      id: tiprackId,
      labwareDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      def: fixture_tiprack_300_ul,
    }
    let robotState = makeState({
      invariantContext: _invariantContext,
      labwareLocations: { [tiprackId]: { slot: '8' } },
      pipetteLocations: {
        p300SingleId: { mount: 'left' },
        p300MultiId: { mount: 'right' },
      },
      tiprackSetting: { [tiprackId]: true },
    })
    robotState.tipState.tipracks[tiprackId] = tiprackTipState
    return _getNextTip({
      pipetteId,
      tiprackId,
      invariantContext: _invariantContext,
      robotState,
    })
  }
  it('empty tiprack should return null', () => {
    const channels = [1, 8]
    channels.forEach(channel => {
      const result = getNextTipHelper(channel, { ...getTiprackTipstate(false) })
      expect(result).toBe(null)
    })
  })

  it('full tiprack should start at A1', () => {
    const result = getNextTipHelper(1, { ...getTiprackTipstate(true) })
    expect(result).toEqual('A1')
  })

  it('missing A1, go to B1', () => {
    const result = getNextTipHelper(1, {
      ...getTiprackTipstate(true),
      A1: false,
    })
    expect(result).toEqual('B1')
  })

  it('missing A1 and B1, go to C1', () => {
    const result = getNextTipHelper(1, {
      ...getTiprackTipstate(true),
      A1: false,
      B1: false,
    })
    expect(result).toEqual('C1')
  })

  it('missing first column, go to A2', () => {
    const result = getNextTipHelper(1, {
      ...getTiprackTipstate(true),
      ...getTipColumn(1, false),
    })
    expect(result).toEqual('A2')
  })

  it('missing a few random tips, go to lowest col, then lowest row', () => {
    const result = getNextTipHelper(1, {
      ...getTiprackTipstate(true),
      ...getTipColumn(1, false),
      ...getTipColumn(2, false),
      D2: true,
    })
    expect(result).toEqual('D2')
  })
})

describe('getNextTiprack - single-channel', () => {
  it('single tiprack, missing A1', () => {
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

    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('B1')
  })

  it('single tiprack, empty, should return null', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: { tiprack1Id: { slot: '1' } },
      tiprackSetting: { tiprack1Id: false },
    })

    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)
    expect(result).toEqual(null)
  })

  it('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
    })
    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A1')
  })

  it('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
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
    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('B1')
  })

  it('multiple tipracks, all empty, should return null', () => {
    let robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: false, tiprack2Id: false },
    })
    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)

    expect(result).toBe(null)
  })
})

describe('getNextTiprack - 8-channel', () => {
  it('single tiprack, totally full', () => {
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

  it('single tiprack, partially full', () => {
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

  it('single tiprack, empty, should return null', () => {
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

  it('single tiprack, a well missing from each column, should return null', () => {
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

  it('multiple tipracks, all full, should return the filled tiprack in the lowest slot', () => {
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

  it('multiple tipracks, some partially full, should return the filled tiprack in the lowest slot', () => {
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

  it('multiple tipracks, all empty, should return null', () => {
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

describe('getModuleState', () => {
  it('returns the state for specified module', () => {
    const magModuleId = 'magdeck123'
    const magModuleState = {
      type: MAGNETIC_MODULE_TYPE,
      engaged: true,
    }
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: false },
      moduleLocations: {
        [magModuleId]: {
          slot: '4',
          moduleState: magModuleState,
        },
      },
    })

    const moduleState = getModuleState(robotState, magModuleId)

    expect(moduleState).toEqual(magModuleState)
  })
})
