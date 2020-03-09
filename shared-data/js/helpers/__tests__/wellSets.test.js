// @flow
import fixture_12_trough from '../../../labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '../../../labware/fixtures/2/fixture_96_plate.json'
import fixture_384_plate from '../../../labware/fixtures/2/fixture_384_plate.json'
import { makeWellSetHelpers } from '../wellSets'

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
