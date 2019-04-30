import {
  fixture12Trough,
  fixture96Plate,
  fixture384Plate,
} from '@opentrons/shared-data/fixtures'
import {
  getWellSetForMultichannel,
  getWellSetForMultichannelDeprecated,
} from '../utils'

describe('getWellSetForMultichannel (integration test)', () => {
  test('96-flat', () => {
    const labware = fixture96Plate
    expect(getWellSetForMultichannel(labware, 'A1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labware, 'B1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labware, 'H1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannel(labware, 'A2')).toEqual([
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

  test('invalid well', () => {
    const labware = fixture96Plate
    expect(getWellSetForMultichannel(labware, 'A13')).toBeFalsy()
  })

  test('trough-12row', () => {
    const labware = fixture12Trough
    expect(getWellSetForMultichannel(labware, 'A1')).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])

    expect(getWellSetForMultichannel(labware, 'A2')).toEqual([
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

  test('384-plate', () => {
    const labware = fixture384Plate
    expect(getWellSetForMultichannel(labware, 'C1')).toEqual([
      'A1',
      'C1',
      'E1',
      'G1',
      'I1',
      'K1',
      'M1',
      'O1',
    ])

    expect(getWellSetForMultichannel(labware, 'F2')).toEqual([
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

// TODO: Ian 2019-04-12 below is DEPRECATED, remove when
// getWellSetForMultichannelDeprecated is deleted

describe('getWellSetForMultichannelDeprecated (integration test)', () => {
  test('96-flat', () => {
    const labwareName = '96-flat'
    expect(getWellSetForMultichannelDeprecated(labwareName, 'A1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannelDeprecated(labwareName, 'B1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannelDeprecated(labwareName, 'H1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])

    expect(getWellSetForMultichannelDeprecated(labwareName, 'A2')).toEqual([
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

  test('invalid well', () => {
    const labwareName = '96-flat'
    expect(getWellSetForMultichannelDeprecated(labwareName, 'A13')).toBeFalsy()
  })

  test('trough-12row', () => {
    const labwareName = 'trough-12row'
    expect(getWellSetForMultichannelDeprecated(labwareName, 'A1')).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])

    expect(getWellSetForMultichannelDeprecated(labwareName, 'A2')).toEqual([
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

  test('384-plate', () => {
    const labwareName = '384-plate'
    expect(getWellSetForMultichannelDeprecated(labwareName, 'C1')).toEqual([
      'A1',
      'C1',
      'E1',
      'G1',
      'I1',
      'K1',
      'M1',
      'O1',
    ])

    expect(getWellSetForMultichannelDeprecated(labwareName, 'F2')).toEqual([
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

  test('missing labware definition', () => {
    const labwareName = 'custom-labware-that-does-not-have-defz'
    console.warn = jest.fn() // TODO Better way to suppress console.warn?

    expect(getWellSetForMultichannelDeprecated(labwareName, 'A1')).toBeFalsy()
  })
})
