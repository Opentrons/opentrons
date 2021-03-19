// @flow

import * as Types from '../types'
import * as ApiTypes from '../api-types'

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockApiTemperatureModuleLegacy: ApiTypes.ApiTemperatureModuleLegacy = {
  name: 'tempdeck',
  displayName: 'Temperature Deck',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  model: 'temp_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
}

export const mockApiTemperatureModule: ApiTypes.ApiTemperatureModule = {
  name: 'tempdeck',
  displayName: 'tempdeck',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  revision: 'temp_deck_v4.0',
  moduleModel: 'temperatureModuleV1',
  model: 'temp_deck_v1.5',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
}

export const mockApiTemperatureModuleGen2: ApiTypes.ApiTemperatureModule = {
  name: 'tempdeck',
  displayName: 'tempdeck',
  model: 'temp_deck_v20',
  moduleModel: 'temperatureModuleV2',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  revision: 'temp_deck_v20',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
}

export const mockTemperatureModule: Types.TemperatureModule = {
  model: 'temperatureModuleV1',
  type: 'temperatureModuleType',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  revision: 'temp_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
}

export const mockTemperatureModuleGen2: Types.TemperatureModule = {
  model: 'temperatureModuleV2',
  type: 'temperatureModuleType',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  revision: 'temp_deck_v20.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
}

export const mockApiMagneticModuleLegacy: ApiTypes.ApiMagneticModuleLegacy = {
  name: 'magdeck',
  displayName: 'Magnetic Deck',
  port: '/dev/ot_module_magdeck0',
  serial: 'def456',
  model: 'mag_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'disengaged',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
  },
}

export const mockApiMagneticModule: ApiTypes.ApiMagneticModule = {
  name: 'magdeck',
  displayName: 'magdeck',
  model: 'mag_deck_v4.0',
  moduleModel: 'magneticModuleV1',
  port: '/dev/ot_module_magdeck0',
  serial: 'def456',
  revision: 'mag_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'disengaged',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
  },
}

export const mockApiMagneticModuleGen2: ApiTypes.ApiMagneticModule = {
  name: 'magdeck',
  displayName: 'magdeck',
  model: 'mag_deck_v20',
  moduleModel: 'magneticModuleV2',
  port: '/dev/ot_module_magdeck0',
  serial: 'def456',
  revision: 'mag_deck_v20',
  fwVersion: 'v2.0.0',
  status: 'disengaged',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
  },
}

export const mockMagneticModule: Types.MagneticModule = {
  model: 'magneticModuleV1',
  type: 'magneticModuleType',
  port: '/dev/ot_module_magdeck0',
  serial: 'def456',
  revision: 'mag_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'disengaged',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
  },
}

export const mockApiThermocyclerLegacy: ApiTypes.ApiThermocyclerModuleLegacy = {
  name: 'thermocycler',
  displayName: 'Thermocycler',
  port: '/dev/ot_module_thermocycler0',
  serial: 'ghi789',
  model: 'thermocycler_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
    lidTarget: null,
    lidTemp: null,
    currentTemp: null,
    targetTemp: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
  },
}

export const mockApiThermocycler: ApiTypes.ApiThermocyclerModule = {
  name: 'thermocycler',
  displayName: 'thermocycler',
  port: '/dev/ot_module_thermocycler0',
  serial: 'ghi789',
  model: 'thermocycler_v4.0',
  moduleModel: 'thermocyclerModuleV1',
  revision: 'thermocycler_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
    lidTarget: null,
    lidTemp: null,
    currentTemp: null,
    targetTemp: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
  },
}

export const mockThermocycler: Types.ThermocyclerModule = {
  model: 'thermocyclerModuleV1',
  type: 'thermocyclerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'ghi789',
  revision: 'thermocycler_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
    lidTarget: null,
    lidTemp: null,
    currentTemp: null,
    targetTemp: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
  },
}

// fetch modules fixtures

export const mockFetchModulesSuccessMeta = {
  method: 'GET',
  path: '/modules',
  ok: true,
  status: 200,
}

export const mockFetchModulesSuccess = {
  ...mockFetchModulesSuccessMeta,
  host: mockRobot,
  body: {
    modules: [
      mockApiMagneticModule,
      mockApiTemperatureModule,
      mockApiThermocycler,
    ],
  },
}

export const mockLegacyFetchModulesSuccess = {
  ...mockFetchModulesSuccessMeta,
  host: mockRobot,
  body: {
    modules: [
      mockApiMagneticModuleLegacy,
      mockApiTemperatureModuleLegacy,
      mockApiThermocyclerLegacy,
    ],
  },
}

export const mockFetchModulesSuccessActionPayloadModules = [
  mockMagneticModule,
  mockTemperatureModule,
  mockThermocycler,
]

export const mockFetchModulesFailureMeta = {
  method: 'GET',
  path: '/modules',
  ok: false,
  status: 500,
}

export const mockFetchModulesFailure = {
  ...mockFetchModulesFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// send module command fixtures

export const mockSendModuleCommandSuccessMeta = {
  method: 'POST',
  path: '/modules/abc123',
  ok: true,
  status: 200,
}

export const mockSendModuleCommandSuccess = {
  ...mockSendModuleCommandSuccessMeta,
  host: mockRobot,
  body: {
    message: 'Success',
    returnValue: 42,
  },
}

export const mockSendModuleCommandFailureMeta = {
  method: 'POST',
  path: '/modules/abc123',
  ok: false,
  status: 500,
}

export const mockSendModuleCommandFailure = {
  ...mockSendModuleCommandFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// update module command fixtures

export const mockUpdateModuleSuccessMeta = {
  method: 'POST',
  path: '/modules/abc123/update',
  ok: true,
  status: 200,
}

export const mockUpdateModuleSuccess = {
  ...mockUpdateModuleSuccessMeta,
  host: mockRobot,
  body: {
    message: 'update successful',
  },
}

export const mockUpdateModuleFailureMeta = {
  method: 'POST',
  path: '/modules/abc123/update',
  ok: false,
  status: 500,
}

export const mockUpdateModuleFailure = {
  ...mockUpdateModuleFailureMeta,
  host: mockRobot,
  body: { message: 'BAD NEWS BEARS' },
}
