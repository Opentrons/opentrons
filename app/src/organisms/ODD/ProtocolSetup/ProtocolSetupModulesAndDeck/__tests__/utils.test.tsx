import { describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleDef,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { mockTemperatureModuleGen2 } from '@opentrons/api-client'

import {
  getDoesModuleRequireCalibration,
  getUnmatchedModulesForProtocol,
} from '../utils'

import type { AttachedModule } from '@opentrons/api-client'

const temperatureProtocolModule = {
  moduleId: 'mockTempModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: getModuleDef('temperatureModuleV2'),
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: 'D1',
}

const magneticProtocolModule = {
  moduleId: 'mockMagneticModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: getModuleDef('magneticModuleV2'),
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: 'D1',
}

describe('getUnmatchedModulesForProtocol', () => {
  it('returns no missing module ids or remaining attached modules when no modules required or attached', () => {
    const result = getUnmatchedModulesForProtocol([], [])
    expect(result).toEqual({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
  })

  it('returns no missing module ids or remaining attached modules when attached modules match', () => {
    const result = getUnmatchedModulesForProtocol(
      [mockTemperatureModuleGen2],
      [temperatureProtocolModule]
    )
    expect(result).toEqual({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
  })

  it('returns missing module ids when protocol modules missing', () => {
    const result = getUnmatchedModulesForProtocol(
      [],
      [temperatureProtocolModule, magneticProtocolModule]
    )
    expect(result).toEqual({
      missingModuleIds: ['mockTempModuleId', 'mockMagneticModuleId'],
      remainingAttachedModules: [],
    })
  })

  it('returns remaining attached modules when protocol modules and attached modules do not match', () => {
    const result = getUnmatchedModulesForProtocol(
      [mockTemperatureModuleGen2],
      [magneticProtocolModule]
    )
    expect(result).toEqual({
      missingModuleIds: ['mockMagneticModuleId'],
      remainingAttachedModules: [mockTemperatureModuleGen2],
    })
  })
})

describe('getDoesModuleRequireCalibration', () => {
  ;[
    TEMPERATURE_MODULE_TYPE,
    MAGNETIC_MODULE_TYPE,
    THERMOCYCLER_MODULE_TYPE,
    HEATERSHAKER_MODULE_TYPE,
  ].forEach(moduleType => {
    const mockModule = {
      moduleType,
    } as AttachedModule
    it(`returns true for ${moduleType} that requires calibration`, () => {
      expect(getDoesModuleRequireCalibration(mockModule)).toBe(true)
    })
  })
  ;[
    TEMPERATURE_MODULE_TYPE,
    MAGNETIC_MODULE_TYPE,
    THERMOCYCLER_MODULE_TYPE,
    HEATERSHAKER_MODULE_TYPE,
  ].forEach(moduleType => {
    const mockModule = {
      moduleType,
      moduleOffset: {
        last_modified: '2026-02-23T14:42:20.131798+00:00',
      },
    } as AttachedModule
    it(`returns false for ${moduleType} that has calibration data`, () => {
      expect(getDoesModuleRequireCalibration(mockModule)).toBe(false)
    })
  })
  ;[
    ABSORBANCE_READER_TYPE,
    FLEX_STACKER_MODULE_TYPE,
    VACUUM_MODULE_TYPE,
  ].forEach(moduleType => {
    const mockModule = {
      moduleType,
      moduleOffset: undefined,
    } as AttachedModule
    it('returns false for modules that do not require calibration', () => {
      expect(getDoesModuleRequireCalibration(mockModule)).toBe(false)
    })
  })
})
