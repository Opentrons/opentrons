// @flow
import {
  fixtureP10Single,
  fixtureP10Multi,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_12_trough from '../../../labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '../../../labware/fixtures/2/fixture_96_plate.json'
import fixture_384_plate from '../../../labware/fixtures/2/fixture_384_plate.json'
import fixture_overlappy_wellplate from '../../../labware/fixtures/2/fixture_overlappy_wellplate'
import { makeWellSetHelpers } from '../wellSets'
import { findWellAt } from '../getWellNamePerMultiTip'

describe('findWellAt', () => {
  it('should determine if given (x, y) is within a rectangular well', () => {
    const def: any = {
      wells: {
        A1: {
          shape: 'rectangular',
          x: 200,
          y: 200,
          xDimension: 10,
          yDimension: 10,
        },
      },
    }
    const middle = findWellAt(def, 200, 200)
    expect(middle).toBe('A1')

    const insideCornerNE = findWellAt(def, 200 - 4, 200 + 4)
    expect(insideCornerNE).toEqual('A1')

    // exactly at an edge doesn't count
    const exactlyOnCornerNE = findWellAt(def, 200 - 5, 200 + 5)
    expect(exactlyOnCornerNE).toBeUndefined()

    const exactlyOnWEdge = findWellAt(def, 200, 200 - 5)
    expect(exactlyOnWEdge).toBeUndefined()

    const justOutsideToEast = findWellAt(def, 200 + 5.1, 200)
    expect(justOutsideToEast).toBeUndefined()
  })

  it('should determine if given (x, y) is within a circular well', () => {
    const def: any = {
      wells: {
        A1: {
          shape: 'circular',
          x: 200,
          y: 200,
          diameter: 10,
        },
      },
    }
    const middle = findWellAt(def, 200, 200)
    expect(middle).toBe('A1')

    const inside = findWellAt(def, 200 - 1, 200 + 1)
    expect(inside).toEqual('A1')

    // exactly at an edge doesn't count
    const exactlyOnWEdge = findWellAt(def, 200, 200 - 5)
    expect(exactlyOnWEdge).toBeUndefined()

    const justOutsideToEast = findWellAt(def, 200 + 5.1, 200)
    expect(justOutsideToEast).toBeUndefined()
  })
})

describe('canPipetteUseLabware', () => {
  let canPipetteUseLabware
  beforeEach(() => {
    const helpers = makeWellSetHelpers()
    canPipetteUseLabware = helpers.canPipetteUseLabware
  })
  it('returns false when wells are too close together for multi channel pipette', () => {
    const labwareDef = { ...fixture_overlappy_wellplate }
    const pipette = { ...fixtureP10Multi }
    expect(canPipetteUseLabware(pipette, labwareDef)).toBe(false)
  })
  it('returns true when pipette is single channel', () => {
    const labwareDef = { ...fixture_overlappy_wellplate }
    const pipette = { ...fixtureP10Single }
    expect(canPipetteUseLabware(pipette, labwareDef)).toBe(true)
  })
})

describe('getWellSetForMultichannel (integration test)', () => {
  let getWellSetForMultichannel
  beforeEach(() => {
    const helpers = makeWellSetHelpers()
    getWellSetForMultichannel = helpers.getWellSetForMultichannel
  })
  it('96-flat', () => {
    const labwareDef = fixture_96_plate
    expect(getWellSetForMultichannel(labwareDef, 'A1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'B1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'H1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'A2')).toEqual([
      'A2',
      'B2',
      'C2',
      'D2',
      'E2',
      'F2',
      'G2',
      'H2',
    ])
  })

  it('invalid well', () => {
    const labwareDef = fixture_96_plate
    expect(getWellSetForMultichannel(labwareDef, 'A13')).toBeFalsy()
  })

  it('trough-12row', () => {
    const labwareDef = fixture_12_trough
    expect(getWellSetForMultichannel(labwareDef, 'A1')).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'A2')).toEqual([
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
    ])
  })

  it('384-plate', () => {
    const labwareDef = fixture_384_plate
    expect(getWellSetForMultichannel(labwareDef, 'C1')).toEqual([
      'A1',
      'C1',
      'E1',
      'G1',
      'I1',
      'K1',
      'M1',
      'O1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'F2')).toEqual([
      'B2',
      'D2',
      'F2',
      'H2',
      'J2',
      'L2',
      'N2',
      'P2',
    ])
  })
})
