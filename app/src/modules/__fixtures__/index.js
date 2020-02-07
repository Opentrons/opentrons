// @flow

import * as Types from '../types'

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockTemperatureModule: Types.TemperatureModule = {
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

export const mockMagneticModule: Types.MagneticModule = {
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

export const mockThermocycler: Types.ThermocyclerModule = {
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
    modules: [mockTemperatureModule],
  },
}

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
