import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_384_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_384_plate.json'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_24_tuberack from '@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack.json'

import { getWellNamePerMultiTip } from '../helpers/getWellNamePerMultiTip'

import type { LabwareDefinition2 } from '../types'

const fixtureTrash = fixture_trash as LabwareDefinition2
const fixture96Plate = fixture_96_plate as LabwareDefinition2
const fixture384Plate = fixture_384_plate as LabwareDefinition2
const fixture12Trough = fixture_12_trough as LabwareDefinition2
const fixture24Tuberack = fixture_24_tuberack as LabwareDefinition2
const EIGHT_CHANNEL = 8

describe('96 plate', () => {
  const labware = fixture96Plate

  it('A1 => column 1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1', EIGHT_CHANNEL)).toEqual([
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

  it('A2 => column 2', () => {
    expect(getWellNamePerMultiTip(labware, 'A2', EIGHT_CHANNEL)).toEqual([
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

  it('B1 => null (cannot access with 8-channel)', () => {
    expect(getWellNamePerMultiTip(labware, 'B1', EIGHT_CHANNEL)).toEqual(null)
  })
})

describe('384 plate', () => {
  const labware = fixture384Plate

  it('A1 => column 1 ACEGIKMO', () => {
    expect(getWellNamePerMultiTip(labware, 'A1', EIGHT_CHANNEL)).toEqual([
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

  it('A2 => column 2 ACEGIKMO', () => {
    expect(getWellNamePerMultiTip(labware, 'A2', EIGHT_CHANNEL)).toEqual([
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

  it('B1 => column 1 BDFHJLNP', () => {
    expect(getWellNamePerMultiTip(labware, 'B1', EIGHT_CHANNEL)).toEqual([
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

  it('C1 => null (cannot access with 8-channel)', () => {
    expect(getWellNamePerMultiTip(labware, 'C1', EIGHT_CHANNEL)).toEqual(null)
  })
})

describe('Fixed trash', () => {
  const labware = fixtureTrash

  it('A1 => all tips in A1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1', EIGHT_CHANNEL)).toEqual([
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

  it('A2 => null (well does not exist)', () => {
    expect(getWellNamePerMultiTip(labware, 'A2', EIGHT_CHANNEL)).toEqual(null)
  })
})

describe('tube rack 2mL', () => {
  const labware = fixture24Tuberack

  it('tube rack 2mL not accessible by 8-channel (return null)', () => {
    ;['A1', 'A2', 'B1', 'B2'].forEach(well => {
      expect(getWellNamePerMultiTip(labware, well, EIGHT_CHANNEL)).toEqual(null)
    })
  })
})

describe('12 channel trough', () => {
  const labware = fixture12Trough

  it('A1 => all tips in A1', () => {
    expect(getWellNamePerMultiTip(labware, 'A1', EIGHT_CHANNEL)).toEqual([
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

  it('A2 => all tips in A2', () => {
    expect(getWellNamePerMultiTip(labware, 'A2', EIGHT_CHANNEL)).toEqual([
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

  it('B1 => null (well does not exist)', () => {
    expect(getWellNamePerMultiTip(labware, 'B1', EIGHT_CHANNEL)).toEqual(null)
  })
})
