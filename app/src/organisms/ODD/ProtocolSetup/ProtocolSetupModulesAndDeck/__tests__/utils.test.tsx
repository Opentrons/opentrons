import { describe, it, expect } from 'vitest'
import { getModuleDef2 } from '@opentrons/shared-data'

import { mockTemperatureModuleGen2 } from '/app/redux/modules/__fixtures__'
import { getUnmatchedModulesForProtocol } from '../utils'

const temperatureProtocolModule = {
  moduleId: 'mockTempModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: getModuleDef2('temperatureModuleV2'),
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
  moduleDef: getModuleDef2('magneticModuleV2'),
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
