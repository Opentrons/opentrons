import { describe, expect, it } from 'vitest'

import {
  ALL,
  COLUMN,
  fixture12Trough,
  fixture96Plate,
  ROW,
} from '@opentrons/shared-data'

import { getPipetteCriticalPoint } from '../getPipetteCriticalPoint'

import type {
  LabwareDefinition,
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { PipetteEntity } from '../../types'

describe('getPipetteCriticalPoint', () => {
  const mockNozzleMap = {
    A1: [0, 0, 0],
    A12: [0, 110, 0],
    H1: [70, 0, 0],
    H12: [70, 110, 0],
  }

  const mock96chPipetteEntity = {
    spec: {
      nozzleMap: mockNozzleMap,
    },
    channels: 96,
  } as unknown as PipetteEntity
  const mock8chPipetteEntity = {
    spec: {
      nozzleMap: mockNozzleMap,
    },
    channels: 8,
  } as unknown as PipetteEntity

  it('returns primary nozzle position for COLUMN configuration (centering handled by getPipetteCenteringYOffset)', () => {
    const result = getPipetteCriticalPoint(
      COLUMN as NozzleConfigurationStyle,
      mock96chPipetteEntity,
      'A1' as PrimaryNozzleConfigurationStyle,
      fixture12Trough as LabwareDefinition
    )

    // COLUMN centering is handled by getPipetteCenteringYOffset, not here
    expect(result).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('returns center point for ROW configuration when labware has one row', () => {
    const result = getPipetteCriticalPoint(
      ROW as NozzleConfigurationStyle,
      mock96chPipetteEntity,
      'A1' as PrimaryNozzleConfigurationStyle,
      fixture12Trough as LabwareDefinition
    )

    // midpoint between A1 [0,0,0] and A12 [0,110,0] → [0,55,0]
    expect(result).toEqual({ x: 0, y: 55, z: 0 })
  })

  it('returns primary nozzle position for COLUMN configuration with A12 primary nozzle', () => {
    const result = getPipetteCriticalPoint(
      COLUMN as NozzleConfigurationStyle,
      mock96chPipetteEntity,
      'A12' as PrimaryNozzleConfigurationStyle,
      fixture12Trough as LabwareDefinition
    )

    // COLUMN centering is handled by getPipetteCenteringYOffset, not here
    expect(result).toEqual({ x: 0, y: 110, z: 0 })
  })

  it('returns default position when labware has more than one column', () => {
    const result = getPipetteCriticalPoint(
      COLUMN as NozzleConfigurationStyle,
      mock96chPipetteEntity,
      'A1' as PrimaryNozzleConfigurationStyle,
      fixture96Plate as LabwareDefinition
    )

    expect(result).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('returns default position when nozzle configuration is neither ROW nor COLUMN', () => {
    const result = getPipetteCriticalPoint(
      'SINGLE' as NozzleConfigurationStyle,
      mock96chPipetteEntity,
      'H12' as PrimaryNozzleConfigurationStyle,
      fixture12Trough as LabwareDefinition
    )

    expect(result).toEqual({ x: 70, y: 110, z: 0 })
  })
  it('returns the top point for 8ch ALL configuration when labware has one row', () => {
    const result = getPipetteCriticalPoint(
      ALL as NozzleConfigurationStyle,
      mock8chPipetteEntity,
      'A1' as PrimaryNozzleConfigurationStyle,
      fixture12Trough as LabwareDefinition
    )

    expect(result).toEqual({ x: 0, y: 0, z: 0 })
  })
})
