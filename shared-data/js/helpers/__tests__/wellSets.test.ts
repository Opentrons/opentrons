import pipetteNameSpecsFixtures from '../../../pipette/fixtures/name/pipetteNameSpecFixtures.json'
import fixture_12_trough from '../../../labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '../../../labware/fixtures/2/fixture_96_plate.json'
import fixture_384_plate from '../../../labware/fixtures/2/fixture_384_plate.json'
import fixture_overlappy_wellplate from '../../../labware/fixtures/2/fixture_overlappy_wellplate.json'
import { makeWellSetHelpers } from '../wellSets'
import { findWellAt } from '../getWellNamePerMultiTip'
import { get96Channel384WellPlateWells, orderWells } from '..'

import type { LabwareDefinition2, PipetteNameSpecs } from '../../types'
import type { WellSetHelpers } from '../wellSets'

const fixtureP10Single = pipetteNameSpecsFixtures.p10_single as PipetteNameSpecs
const fixtureP10Multi = pipetteNameSpecsFixtures.p10_multi as PipetteNameSpecs
const fixtureP100096 = (pipetteNameSpecsFixtures.p1000_96 as any) as PipetteNameSpecs
const fixture12Trough = fixture_12_trough as LabwareDefinition2
const fixture96Plate = fixture_96_plate as LabwareDefinition2
const fixture384Plate = fixture_384_plate as LabwareDefinition2
const fixtureOverlappyWellplate = fixture_overlappy_wellplate as LabwareDefinition2
const EIGHT_CHANNEL = 8
const NINETY_SIX_CHANNEL = 96
const wellsForReservoir = [
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'A10',
  'A11',
  'A12',
]

const wellsFor96WellPlate = [
  'A1',
  'B1',
  'C1',
  'D1',
  'E1',
  'F1',
  'G1',
  'H1',
  'A2',
  'B2',
  'C2',
  'D2',
  'E2',
  'F2',
  'G2',
  'H2',
  'A3',
  'B3',
  'C3',
  'D3',
  'E3',
  'F3',
  'G3',
  'H3',
  'A4',
  'B4',
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'H4',
  'A5',
  'B5',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'H5',
  'A6',
  'B6',
  'C6',
  'D6',
  'E6',
  'F6',
  'G6',
  'H6',
  'A7',
  'B7',
  'C7',
  'D7',
  'E7',
  'F7',
  'G7',
  'H7',
  'A8',
  'B8',
  'C8',
  'D8',
  'E8',
  'F8',
  'G8',
  'H8',
  'A9',
  'B9',
  'C9',
  'D9',
  'E9',
  'F9',
  'G9',
  'H9',
  'A10',
  'B10',
  'C10',
  'D10',
  'E10',
  'F10',
  'G10',
  'H10',
  'A11',
  'B11',
  'C11',
  'D11',
  'E11',
  'F11',
  'G11',
  'H11',
  'A12',
  'B12',
  'C12',
  'D12',
  'E12',
  'F12',
  'G12',
  'H12',
]

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
  let canPipetteUseLabware: WellSetHelpers['canPipetteUseLabware']

  beforeEach(() => {
    const helpers = makeWellSetHelpers()
    canPipetteUseLabware = helpers.canPipetteUseLabware
  })

  it('returns false when wells are too close together for multi channel pipettes', () => {
    const labwareDef = fixtureOverlappyWellplate
    const pipette = fixtureP10Multi
    const pipette96 = fixtureP100096

    expect(canPipetteUseLabware(pipette, labwareDef)).toBe(false)
    expect(canPipetteUseLabware(pipette96, labwareDef)).toBe(false)
  })

  it('returns true when pipette is single channel', () => {
    const labwareDef = fixtureOverlappyWellplate
    const pipette = fixtureP10Single

    expect(canPipetteUseLabware(pipette, labwareDef)).toBe(true)
  })
  it('returns false when the tip volume is too high with the 384 well plate', () => {
    const labwareDef = fixture384Plate
    const pipette = fixtureP10Multi
    const pipette96 = fixtureP100096

    expect(canPipetteUseLabware(pipette, labwareDef)).toBe(false)
    expect(canPipetteUseLabware(pipette96, labwareDef)).toBe(false)
  })
})

describe('getWellSetForMultichannel (integration test)', () => {
  let getWellSetForMultichannel: WellSetHelpers['getWellSetForMultichannel']

  beforeEach(() => {
    const helpers = makeWellSetHelpers()
    getWellSetForMultichannel = helpers.getWellSetForMultichannel
  })

  it('96-flat', () => {
    const labwareDef = fixture96Plate

    expect(getWellSetForMultichannel(labwareDef, 'A1', EIGHT_CHANNEL)).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'B1', EIGHT_CHANNEL)).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'H1', EIGHT_CHANNEL)).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'A2', EIGHT_CHANNEL)).toEqual([
      'A2',
      'B2',
      'C2',
      'D2',
      'E2',
      'F2',
      'G2',
      'H2',
    ])

    //  96-channel
    expect(
      getWellSetForMultichannel(labwareDef, 'A1', NINETY_SIX_CHANNEL)
    ).toEqual(wellsFor96WellPlate)
  })

  it('invalid well', () => {
    const labwareDef = fixture96Plate

    expect(
      getWellSetForMultichannel(labwareDef, 'A13', EIGHT_CHANNEL)
    ).toBeFalsy()
  })

  it('trough-12row', () => {
    const labwareDef = fixture12Trough

    expect(getWellSetForMultichannel(labwareDef, 'A1', EIGHT_CHANNEL)).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'A2', EIGHT_CHANNEL)).toEqual([
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
      'A2',
    ])

    //  96-channel
    expect(
      getWellSetForMultichannel(labwareDef, 'A1', NINETY_SIX_CHANNEL)
    ).toEqual(wellsForReservoir)
  })

  it('384-plate', () => {
    const labwareDef = fixture384Plate
    const well96Channel = 'A1'
    const all384Wells = orderWells(labwareDef.ordering, 't2b', 'l2r')
    const ninetySixChannelWells = get96Channel384WellPlateWells(
      all384Wells,
      well96Channel
    )

    expect(getWellSetForMultichannel(labwareDef, 'C1', EIGHT_CHANNEL)).toEqual([
      'A1',
      'C1',
      'E1',
      'G1',
      'I1',
      'K1',
      'M1',
      'O1',
    ])

    expect(getWellSetForMultichannel(labwareDef, 'F2', EIGHT_CHANNEL)).toEqual([
      'B2',
      'D2',
      'F2',
      'H2',
      'J2',
      'L2',
      'N2',
      'P2',
    ])

    //  96-channel
    expect(
      getWellSetForMultichannel(labwareDef, well96Channel, NINETY_SIX_CHANNEL)
    ).toEqual(ninetySixChannelWells)
  })
})
