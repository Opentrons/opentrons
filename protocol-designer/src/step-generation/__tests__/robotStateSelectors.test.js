// @flow
import { getLabwareDefURI, MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  makeContext,
  makeState,
  setTipColumn,
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
  const getNextTipHelper = (channel: 1 | 8, tiprackTipState: Set<string>) => {
    const pipetteId = channel === 1 ? DEFAULT_PIPETTE : 'p300MultiId'
    const tiprackId = 'testTiprack'
    const _invariantContext = makeContext()
    _invariantContext.labwareEntities[tiprackId] = {
      id: tiprackId,
      labwareDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      def: fixture_tiprack_300_ul,
    }
    const robotState = makeState({
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
      const result = getNextTipHelper(channel, getTiprackTipstate(false))
      expect(result).toBe(null)
    })
  })

  it('full tiprack should start at A1', () => {
    const result = getNextTipHelper(1, getTiprackTipstate(true))
    expect(result).toEqual('A1')
  })

  it('missing A1, go to B1', () => {
    const tips: Set<string> = getTiprackTipstate(true)
    tips.delete('A1')
    const result = getNextTipHelper(1, tips)
    expect(result).toEqual('B1')
  })

  it('missing A1 and B1, go to C1', () => {
    const tips: Set<string> = getTiprackTipstate(true)
    tips.delete('A1')
    tips.delete('B1')
    const result = getNextTipHelper(1, tips)
    expect(result).toEqual('C1')
  })

  it('missing first column, go to A2', () => {
    const tips: Set<string> = getTiprackTipstate(true)
    setTipColumn(1, false, tips)
    const result = getNextTipHelper(1, tips)
    expect(result).toEqual('A2')
  })

  it('missing a few random tips, go to lowest col, then lowest row', () => {
    const tips: Set<string> = getTiprackTipstate(true)
    setTipColumn(1, false, tips)
    setTipColumn(2, false, tips)
    tips.add('D2')
    const result = getNextTipHelper(1, tips)
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

    robotState.tipState.tipracks.tiprack1Id.delete('A1')

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
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
        tiprack2Id: { slot: '11' },
      },
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
    })
    // remove A1 tip from both racks
    robotState.tipState.tipracks.tiprack1Id.delete('A1')
    robotState.tipState.tipracks.tiprack2Id.delete('A1')
    const result = getNextTiprack(DEFAULT_PIPETTE, invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('B1')
  })

  it('multiple tipracks, all empty, should return null', () => {
    const robotState = makeState({
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
    const robotState = makeState({
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
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: true },
    })

    robotState.tipState.tipracks.tiprack1Id.delete('A1')
    robotState.tipState.tipracks.tiprack1Id.delete('A2')
    robotState.tipState.tipracks.tiprack1Id.delete('A5')
    const result = getNextTiprack('p300MultiId', invariantContext, robotState)

    expect(result && result.tiprackId).toEqual('tiprack1Id')
    expect(result && result.well).toEqual('A3')
  })

  it('single tiprack, empty, should return null', () => {
    const robotState = makeState({
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
    const robotState = makeState({
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '2' },
      },
      tiprackSetting: { tiprack1Id: true },
    })

    robotState.tipState.tipracks.tiprack1Id.delete('F1')
    robotState.tipState.tipracks.tiprack1Id.delete('B2')
    robotState.tipState.tipracks.tiprack1Id.delete('C3')
    robotState.tipState.tipracks.tiprack1Id.delete('A4')
    robotState.tipState.tipracks.tiprack1Id.delete('H5')
    robotState.tipState.tipracks.tiprack1Id.delete('E6')
    robotState.tipState.tipracks.tiprack1Id.delete('B7')
    robotState.tipState.tipracks.tiprack1Id.delete('A8')
    robotState.tipState.tipracks.tiprack1Id.delete('C9')
    robotState.tipState.tipracks.tiprack1Id.delete('D10')
    robotState.tipState.tipracks.tiprack1Id.delete('G11')
    robotState.tipState.tipracks.tiprack1Id.delete('F12')

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
    const robotState = makeState({
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
    // empty row, 8-channel cannot use
    robotState.tipState.tipracks.tiprack1Id.delete('A1')
    robotState.tipState.tipracks.tiprack1Id.delete('A2')
    robotState.tipState.tipracks.tiprack1Id.delete('A3')
    robotState.tipState.tipracks.tiprack1Id.delete('A4')
    robotState.tipState.tipracks.tiprack1Id.delete('A5')
    robotState.tipState.tipracks.tiprack1Id.delete('A6')
    robotState.tipState.tipracks.tiprack1Id.delete('A7')
    robotState.tipState.tipracks.tiprack1Id.delete('A8')
    robotState.tipState.tipracks.tiprack1Id.delete('A9')
    robotState.tipState.tipracks.tiprack1Id.delete('A10')
    robotState.tipState.tipracks.tiprack1Id.delete('A11')
    robotState.tipState.tipracks.tiprack1Id.delete('A12')

    // empty diagonal, 8-channel cannot use
    robotState.tipState.tipracks.tiprack2Id.delete('F1')
    robotState.tipState.tipracks.tiprack2Id.delete('B2')
    robotState.tipState.tipracks.tiprack2Id.delete('C3')
    robotState.tipState.tipracks.tiprack2Id.delete('A4')
    robotState.tipState.tipracks.tiprack2Id.delete('H5')
    robotState.tipState.tipracks.tiprack2Id.delete('E6')
    robotState.tipState.tipracks.tiprack2Id.delete('B7')
    robotState.tipState.tipracks.tiprack2Id.delete('A8')
    robotState.tipState.tipracks.tiprack2Id.delete('C9')
    robotState.tipState.tipracks.tiprack2Id.delete('D10')
    robotState.tipState.tipracks.tiprack2Id.delete('G11')
    robotState.tipState.tipracks.tiprack2Id.delete('F12')

    robotState.tipState.tipracks.tiprack3Id.delete('A1')

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
