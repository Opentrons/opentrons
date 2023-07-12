import * as Types from '../types'
import * as ApiTypes from '../api-types'
import type {
  RobotApiResponse,
  RobotApiResponseMeta,
} from '../../robot-api/types'

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockApiTemperatureModuleLegacy: ApiTypes.ApiTemperatureModuleLegacy = {
  name: 'tempdeck',
  serialNumber: 'abc123',
  moduleModel: 'temp_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: '1',
}

export const mockApiTemperatureModule: ApiTypes.ApiTemperatureModule = {
  name: 'tempdeck',
  id: 'tempdeck_id',
  serialNumber: 'abc123',
  hardwareRevision: 'temp_deck_v4.0',
  moduleModel: 'temperatureModuleV1',
  moduleType: 'temperatureModuleType',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: { hub: null, port: 1, path: '/dev/ot_module_tempdeck0' },
}

export const mockApiTemperatureModuleGen2: ApiTypes.ApiTemperatureModule = {
  id: 'tempdeck_id',
  name: 'tempdeck',
  moduleType: 'temperatureModuleType',
  moduleModel: 'temperatureModuleV2',
  serialNumber: 'abc123',
  hardwareRevision: 'temp_deck_v20',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_tempdeck0' },
}

export const mockTemperatureModule: Types.TemperatureModule = {
  id: 'tempdeck_id',
  moduleModel: 'temperatureModuleV1',
  moduleType: 'temperatureModuleType',
  serialNumber: 'abc123',
  hardwareRevision: 'temp_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_tempdeck0', port: 1, hub: null },
}

export const mockTemperatureModuleGen2: Types.TemperatureModule = {
  id: 'tempdeck_id',
  moduleModel: 'temperatureModuleV2',
  moduleType: 'temperatureModuleType',
  serialNumber: 'abc123',
  hardwareRevision: 'temp_deck_v20.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_tempdeck0', port: 1, hub: null },
}

export const mockApiMagneticModuleLegacy: ApiTypes.ApiMagneticModuleLegacy = {
  name: 'magdeck',
  usbPort: '1',
  serialNumber: 'def456',
  moduleModel: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
}

export const mockApiMagneticModule: ApiTypes.ApiMagneticModule = {
  name: 'magdeck',
  id: 'magdeck_id',
  moduleType: 'magneticModuleType',
  moduleModel: 'magneticModuleV1',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: { hub: null, port: 1, path: '/dev/ot_module_magdeck0' },
}

export const mockApiMagneticModuleGen2: ApiTypes.ApiMagneticModule = {
  id: 'magdeck_id',
  name: 'magdeck',
  moduleType: 'magneticModuleType',
  moduleModel: 'magneticModuleV2',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v20',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: { hub: null, port: 1, path: '/dev/ot_module_magdeck0' },
}

export const mockMagneticModule: Types.MagneticModule = {
  id: 'magdeck_id',
  moduleModel: 'magneticModuleV1',
  moduleType: 'magneticModuleType',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: { path: '/dev/ot_module_magdeck0', port: 1, hub: null },
}

export const mockMagneticModuleGen2: Types.MagneticModule = {
  id: 'magdeck_id',
  moduleModel: 'magneticModuleV2',
  moduleType: 'magneticModuleType',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: { path: '/dev/ot_module_magdeck0', port: 1, hub: null },
}

export const mockApiThermocyclerLegacy: ApiTypes.ApiThermocyclerModuleLegacy = {
  name: 'thermocycler',
  serialNumber: 'ghi789',
  moduleModel: 'thermocyclerModuleV1',
  firmwareVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  usbPort: '1',
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperatureStatus: 'idle',
    lidTemperature: null,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'idle',
  },
}

export const mockApiThermocycler: ApiTypes.ApiThermocyclerModule = {
  id: 'thermocycler_id',
  name: 'thermocycler',
  serialNumber: 'ghi789',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperatureStatus: 'idle',
    lidTemperature: null,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_thermocycler0', port: 1, hub: null },
}

export const mockThermocycler: Types.ThermocyclerModule = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'ghi789',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperatureStatus: 'idle',
    lidTemperature: null,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_thermocycler0', port: 1, hub: null },
}

export const mockThermocyclerGen2: Types.ThermocyclerModule = {
  id: 'thermocycler_id2',
  moduleModel: 'thermocyclerModuleV2',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'ghi789',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperatureStatus: 'idle',
    lidTemperature: null,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_thermocycler2', port: 1, hub: null },
}

export const mockApiHeaterShaker: ApiTypes.ApiHeaterShakerModule = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_unknown',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemperature: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_heatershaker0' },
}

export const mockHeaterShaker: Types.HeaterShakerModule = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_unknown',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemperature: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1, hub: null },
}

export const mockMagneticBlock = {
  id: 'magneticBlock_id',
  moduleModel: 'magneticBlockV1',
  moduleType: 'magneticBlockType',
  displayName: 'Magnetic Block GEN1',
}

// fetch modules fixtures

export const mockFetchModulesSuccessMeta: RobotApiResponseMeta = {
  method: 'GET',
  path: '/modules',
  ok: true,
  status: 200,
}

export const mockFetchModulesSuccess: RobotApiResponse = {
  ...mockFetchModulesSuccessMeta,
  host: mockRobot,
  body: {
    data: [
      mockApiMagneticModule,
      mockApiTemperatureModule,
      mockApiThermocycler,
    ],
  },
}

export const mockLegacyFetchModulesSuccess: RobotApiResponse = {
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

export const mockFetchModulesFailureMeta: RobotApiResponseMeta = {
  method: 'GET',
  path: '/modules',
  ok: false,
  status: 500,
}

export const mockFetchModulesFailure: RobotApiResponse = {
  ...mockFetchModulesFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// send module command fixtures

export const mockSendModuleCommandSuccessMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/modules/abc123',
  ok: true,
  status: 200,
}

export const mockSendModuleCommandSuccess: RobotApiResponse = {
  ...mockSendModuleCommandSuccessMeta,
  host: mockRobot,
  body: {
    message: 'Success',
    returnValue: 42,
  },
}

export const mockSendModuleCommandFailureMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/modules/abc123',
  ok: false,
  status: 500,
}

export const mockSendModuleCommandFailure: RobotApiResponse = {
  ...mockSendModuleCommandFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// update module command fixtures

export const mockUpdateModuleSuccessMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/modules/abc123/update',
  ok: true,
  status: 200,
}

export const mockUpdateModuleSuccess: RobotApiResponse = {
  ...mockUpdateModuleSuccessMeta,
  host: mockRobot,
  body: {
    message: 'update successful',
  },
}

export const mockUpdateModuleFailureMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/modules/abc123/update',
  ok: false,
  status: 500,
}

export const mockUpdateModuleFailure: RobotApiResponse = {
  ...mockUpdateModuleFailureMeta,
  host: mockRobot,
  body: { message: 'BAD NEWS BEARS' },
}
