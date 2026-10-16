import { describe, expect, it } from 'vitest'

import {
  getVacuumCollarSeatingInset,
  getVacuumCollarStackingMeasurement,
  isVacuumCollar,
} from '../../utils/vacuumCollarStacking'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const makeDef = (
  loadName: string,
  quirks: string[],
  options: {
    zDimension?: number
    defaultStackZ?: number
  } = {}
): LabwareDefinition2 =>
  ({
    parameters: { loadName, quirks },
    dimensions: {
      xDimension: 1,
      yDimension: 1,
      zDimension: options.zDimension ?? 42.48,
    },
    stackingOffsetWithLabware:
      options.defaultStackZ != null
        ? { default: { x: 0, y: 0, z: options.defaultStackZ } }
        : undefined,
  }) as LabwareDefinition2

describe('vacuumCollarStacking', () => {
  it('identifies vacuum collars and not spacers', () => {
    expect(
      isVacuumCollar(
        makeDef('opentrons_vacuum_manifold_collar_short', [
          'vacuumModuleDock',
          'providesStackingDefault',
        ])
      )
    ).toBe(true)
    expect(
      isVacuumCollar(
        makeDef('opentrons_vacuum_manifold_spacer_7.25mm', ['vacuumSpacer'])
      )
    ).toBe(false)
  })

  it('reads the collar seating inset from its default stacking offset', () => {
    expect(
      getVacuumCollarSeatingInset(
        makeDef(
          'opentrons_vacuum_manifold_collar_tall',
          ['vacuumModuleDock', 'providesStackingDefault'],
          { defaultStackZ: 3.5 }
        )
      )
    ).toBe(3.5)
    expect(
      getVacuumCollarSeatingInset(
        makeDef('opentrons_vacuum_manifold_collar_short', ['vacuumModuleDock'])
      )
    ).toBe(0)
  })

  it('derives the LC measurement from collar height, seating inset, and skirt', () => {
    expect(getVacuumCollarStackingMeasurement(42.48, 10, 3.5)).toBe(48.98)
    expect(getVacuumCollarStackingMeasurement(71.68, 10, 3.5)).toBe(78.18)
    expect(getVacuumCollarStackingMeasurement(71.68, 12, 3.5)).toBe(80.18)
  })
})
