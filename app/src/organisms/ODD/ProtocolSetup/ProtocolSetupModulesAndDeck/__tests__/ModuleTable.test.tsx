import { describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getModuleDisplayStatus } from '../ModuleTableItem' // Assuming getModuleDisplayStatus is exported or made available for testing

import type {
  AbsorbanceReaderModule,
  FlexStackerModule,
  HeaterShakerModule,
} from '@opentrons/api-client'
import type { CutoutConfig } from '@opentrons/shared-data'
import type { ProtocolCalibrationStatus } from '/app/resources/runs'

const mockHeaterShakerModule: HeaterShakerModule = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: HEATERSHAKER_MODULE_TYPE,
  serialNumber: 'serail123',
  hardwareRevision: 'v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
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
  usbPort: {
    hub: true,
    portGroup: 'unknown',
    port: 1,
    path: '/dev/ot_module_heatershaker0',
  },
  moduleOffset: undefined,
}

const mockFlexStackerModule: FlexStackerModule = {
  id: 'flex_stacker_id',
  moduleType: FLEX_STACKER_MODULE_TYPE,
  moduleModel: 'flexStackerModuleV1',
  serialNumber: 'serail123',
  hardwareRevision: 'v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  data: {
    latchState: 'closed',
    platformState: 'extended',
    hopperDoorState: 'opened',
    installDetected: true,
    status: 'idle',
  },
  usbPort: {
    hub: true,
    portGroup: 'unknown',
    port: 1,
    path: '/dev/ot_module_heatershaker0',
  },
  moduleOffset: undefined,
}

const mockAbsorbanceReaderModule: AbsorbanceReaderModule = {
  id: 'absorbance_reader_id',
  moduleType: ABSORBANCE_READER_TYPE,
  moduleModel: 'absorbanceReaderV1',
  serialNumber: 'serail123',
  hardwareRevision: 'v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  data: {
    lidStatus: 'on',
    platePresence: 'absent',
    sampleWavelength: null,
    status: 'idle',
  },
  usbPort: {
    hub: true,
    portGroup: 'unknown',
    port: 1,
    path: '/dev/ot_module_heatershaker0',
  },
  moduleOffset: undefined,
}

const mockCutoutConfig = (
  overrides: Partial<CutoutConfig> = {}
): CutoutConfig => ({
  cutoutId: 'cutoutA1',
  cutoutFixtureId: 'singleLeftSlot',
  ...overrides,
})

const mockCalibrationStatus: ProtocolCalibrationStatus = {
  complete: true,
}

describe('getModuleDisplayStatus', () => {
  it('should return "locationConflict" if there is a conflicted fixture', () => {
    const attachedModule = mockHeaterShakerModule
    const conflictedFixture = mockCutoutConfig()
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('locationConflict')
  })

  it('should return "disconnected" if the module is not attached', () => {
    const attachedModule = null
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('disconnected')
  })

  // Flex Stacker Tests
  it('should return "shuttleMissing" for Flex Stacker if platformState is missing', () => {
    const attachedModule: FlexStackerModule = {
      ...mockFlexStackerModule,
      data: {
        ...mockFlexStackerModule.data,
        platformState: 'missing',
        latchState: 'closed',
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('shuttleMissing')
  })

  it('should return "needsHome" for Flex Stacker if platformState is not extended', () => {
    const attachedModule: FlexStackerModule = {
      ...mockFlexStackerModule,
      data: {
        ...mockFlexStackerModule.data,
        platformState: 'retracted',
        latchState: 'closed',
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('needsHome')
  })

  it('should return "needsHome" for Flex Stacker if latchState is not closed', () => {
    const attachedModule: FlexStackerModule = {
      ...mockFlexStackerModule,
      data: {
        ...mockFlexStackerModule.data,
        platformState: 'extended',
        latchState: 'opened',
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('needsHome')
  })

  it('should return "connected" for Flex Stacker if platform is extended and latch is closed', () => {
    const attachedModule: FlexStackerModule = {
      ...mockFlexStackerModule,
      data: {
        ...mockFlexStackerModule.data,
        platformState: 'extended',
        latchState: 'closed',
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('connected')
  })

  // Other Module Tests
  it('should return "calibrationBlocked" if module is attached but calibration is not complete', () => {
    const attachedModule = mockHeaterShakerModule
    const conflictedFixture = null
    const calibrationStatus: ProtocolCalibrationStatus = {
      complete: false,
      reason: 'attach_pipette_failure_reason',
    }
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('calibrationBlocked')
  })

  it('should return "needsCalibration" if module is attached, calibration complete, but module offset is null', () => {
    const attachedModule = mockHeaterShakerModule
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('needsCalibration')
  })

  it('should return "needsCalibration" if module is attached, calibration complete, module offset is not null but lastModified field is null', () => {
    const attachedModule: HeaterShakerModule = {
      ...mockHeaterShakerModule,
      moduleOffset: {
        offset: { x: 1, y: 2, z: 3 },
        slot: 'A1',
        last_modified: undefined,
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('needsCalibration')
  })

  it('should return "connected" for Absorbance Reader even if module offset is null', () => {
    const attachedModule = mockAbsorbanceReaderModule
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('connected')
  })

  it('should return "connected" if module is attached, calibration complete, and module offset exists', () => {
    const attachedModule: HeaterShakerModule = {
      ...mockHeaterShakerModule,
      moduleOffset: {
        offset: { x: 1, y: 2, z: 3 },
        slot: 'A1',
        last_modified: '2023-06-01T14:42:20.131798+00:00',
      },
    }
    const conflictedFixture = null
    const calibrationStatus = mockCalibrationStatus
    const status = getModuleDisplayStatus(
      attachedModule,
      conflictedFixture,
      calibrationStatus
    )
    expect(status).toBe('connected')
  })
})
