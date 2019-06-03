// @flow
import fixtureTrash from '@opentrons/shared-data/labware/fixtures/2/fixtureTrash.json'
import fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture96Plate.json'
import fixture384Plate from '@opentrons/shared-data/labware/fixtures/2/fixture384Plate.json'
import fixture12Trough from '@opentrons/shared-data/labware/fixtures/2/fixture12Trough.json'
import fixture24TubeRack from '@opentrons/shared-data/labware/fixtures/2/fixture24TubeRack.json'
import { getWellNamePerMultiTip } from '../helpers/getWellNamePerMultiTip'

describe('96 plate', () => {
  const labware = fixture96Plate

  test('A1 => column 1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1')).toEqual([
      'A1',
      'B1',
      'C1',
      'D1',
      'E1',
      'F1',
      'G1',
      'H1',
    ])
  })

  test('A2 => column 2', () => {
    expect(getWellNamePerMultiTip(labware, 'A2')).toEqual([
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

  test('B1 => null (cannot access with 8-channel)', () => {
    expect(getWellNamePerMultiTip(labware, 'B1')).toEqual(null)
  })
})

describe('384 plate', () => {
  const labware = fixture384Plate

  test('A1 => column 1 ACEGIKMO', () => {
    expect(getWellNamePerMultiTip(labware, 'A1')).toEqual([
      'A1',
      'C1',
      'E1',
      'G1',
      'I1',
      'K1',
      'M1',
      'O1',
    ])
  })

  test('A2 => column 2 ACEGIKMO', () => {
    expect(getWellNamePerMultiTip(labware, 'A2')).toEqual([
      'A2',
      'C2',
      'E2',
      'G2',
      'I2',
      'K2',
      'M2',
      'O2',
    ])
  })

  test('B1 => column 1 BDFHJLNP', () => {
    expect(getWellNamePerMultiTip(labware, 'B1')).toEqual([
      'B1',
      'D1',
      'F1',
      'H1',
      'J1',
      'L1',
      'N1',
      'P1',
    ])
  })

  test('C1 => null (cannot access with 8-channel)', () => {
    expect(getWellNamePerMultiTip(labware, 'C1')).toEqual(null)
  })
})

describe('Fixed trash', () => {
  const labware = fixtureTrash

  test('A1 => all tips in A1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1')).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])
  })

  test('A2 => null (well does not exist)', () => {
    expect(getWellNamePerMultiTip(labware, 'A2')).toEqual(null)
  })
})

describe('tube rack 2mL', () => {
  const labware = fixture24TubeRack
  test('tube rack 2mL not accessible by 8-channel (return null)', () => {
    ;['A1', 'A2', 'B1', 'B2'].forEach(well => {
      expect(getWellNamePerMultiTip(labware, 'A1')).toEqual(null)
    })
  })
})

describe('12 channel trough', () => {
  const labware = fixture12Trough

  test('A1 => all tips in A1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1')).toEqual([
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
      'A1',
    ])
  })

  test('A2 => all tips in A2', () => {
    expect(getWellNamePerMultiTip(labware, 'A2')).toEqual([
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

  test('B1 => null (well does not exist)', () => {
    expect(getWellNamePerMultiTip(labware, 'B1')).toEqual(null)
  })
})
