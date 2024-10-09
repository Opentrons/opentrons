import { describe, it, expect } from 'vitest'
import {
  TEMPERATURE_MODULE_V2_FIXTURE,
  getModuleDef2,
} from '@opentrons/shared-data'

import { mockTemperatureModuleGen2 } from '/app/redux/modules/__fixtures__'
import { getAttachedProtocolModuleMatches } from '../getAttachedProtocolModuleMatches'

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

describe('getAttachedProtocolModuleMatches', () => {
  it('returns no module matches when no modules attached', () => {
    const result = getAttachedProtocolModuleMatches(
      [],
      [temperatureProtocolModule, magneticProtocolModule],
      []
    )
    expect(result).toEqual([
      { ...temperatureProtocolModule, attachedModuleMatch: null },
      { ...magneticProtocolModule, attachedModuleMatch: null },
    ])
  })

  it('returns no module matches when no modules match', () => {
    const result = getAttachedProtocolModuleMatches(
      [mockTemperatureModuleGen2],
      [magneticProtocolModule],
      [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
          opentronsModuleSerialNumber: mockTemperatureModuleGen2.serialNumber,
        },
      ]
    )
    expect(result).toEqual([
      { ...magneticProtocolModule, attachedModuleMatch: null },
    ])
  })

  it('returns module match when modules match', () => {
    const result = getAttachedProtocolModuleMatches(
      [mockTemperatureModuleGen2],
      [temperatureProtocolModule, magneticProtocolModule],
      [
        {
          cutoutId: 'cutoutD1',
          cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
          opentronsModuleSerialNumber: mockTemperatureModuleGen2.serialNumber,
        },
      ]
    )
    expect(result).toEqual([
      {
        ...temperatureProtocolModule,
        attachedModuleMatch: mockTemperatureModuleGen2,
      },
      { ...magneticProtocolModule, attachedModuleMatch: null },
    ])
  })
})
