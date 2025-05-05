import { describe, it, expect } from 'vitest'

import {
    ABSORBANCE_READER_TYPE,
    FLEX_STACKER_MODULE_TYPE,
    THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getModuleDisplayStatus } from '../ModuleTable' // Assuming getModuleDisplayStatus is exported or made available for testing

import type { AttachedModule } from '@opentrons/api-client'
import type { CutoutConfig } from '@opentrons/shared-data'
import type { ProtocolCalibrationStatus } from '/app/resources/runs'

// Mock data builders
const mockNonCalibratedAttachedModule = (
    overrides: Partial<AttachedModule> = {}
): AttachedModule => ({
    id: 'mockModuleId',
    moduleModel: 'thermocyclerModuleV2',
    moduleType: THERMOCYCLER_MODULE_TYPE,
    hardwareRevision: 'rev1',
    firmwareVersion: 'v1.0.0',
    serialNumber: 'serial123',
    data: {},
    usbPort: { port: 1, hub: null, portGroup: 'unknown', hubPort: null },
    ...overrides,
})

// Mock data builders
const mockCalibratedAttachedModule = {
    id: 'mockModuleId',
    moduleModel: 'thermocyclerModuleV2',
    moduleType: THERMOCYCLER_MODULE_TYPE,
    hardwareRevision: 'rev1',
    firmwareVersion: 'v1.0.0',
    serialNumber: 'serial123',
    data: {},
    moduleOffset: {
        offset: { x: 1, y: 2, z: 3 },
        slot: 'A1',
        last_modified: '2023-01-01T00:00:00Z',
    },
    usbPort: { port: 1, hub: null, portGroup: 'unknown', hubPort: null },
} as AttachedModule


const mockFlexStackerModule = (
    overrides: Partial<AttachedModule> = {}
): AttachedModule =>
    mockNonCalibratedAttachedModule({
        moduleType: FLEX_STACKER_MODULE_TYPE,
        moduleModel: 'flexStackerV1',
        data: {
            "latchState": "closed",
            "platformState": "extended",
            "hopperDoorState": "opened",
        },
        ...overrides,
    })

const mockAbsorbanceReaderModule = (
    overrides: Partial<AttachedModule> = {}
): AttachedModule =>
    mockNonCalibratedAttachedModule({
        moduleType: ABSORBANCE_READER_TYPE,
        moduleModel: 'absorbanceReaderV1',
        ...overrides,
    })

const mockCutoutConfig = (
    overrides: Partial<CutoutConfig> = {}
): CutoutConfig => ({
    cutoutId: 'cutoutA1',
    cutoutFixtureId: 'singleSlotStandard',
    ...overrides,
})

const mockCalibrationStatus = (
    overrides: Partial<ProtocolCalibrationStatus> = {}
): ProtocolCalibrationStatus => ({
    complete: true,
    reason: undefined,
    ...overrides,
})

describe('getModuleDisplayStatus', () => {
    it('should return "locationConflict" if there is a conflicted fixture', () => {
        const attachedModule = mockNonCalibratedAttachedModule()
        const conflictedFixture = mockCutoutConfig()
        const calibrationStatus = mockCalibrationStatus()
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
        const calibrationStatus = mockCalibrationStatus()
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('disconnected')
    })

    // Flex Stacker Tests
    it('should return "shuttleMissing" for Flex Stacker if platformState is missing', () => {
        const attachedModule = mockFlexStackerModule({
            data: { platformState: 'missing', latchState: 'closed' },
        })
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus()
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('shuttleMissing')
    })

    it('should return "needsHome" for Flex Stacker if platformState is not extended', () => {
        const attachedModule = mockFlexStackerModule({
            data: { platformState: 'retracted', latchState: 'closed' },
        })
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus()
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('needsHome')
    })

    it('should return "needsHome" for Flex Stacker if latchState is not closed', () => {
        const attachedModule = mockFlexStackerModule({
            data: { platformState: 'extended', latchState: 'open' },
        })
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus()
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('needsHome')
    })

    it('should return "connected" for Flex Stacker if platform is extended and latch is closed', () => {
        const attachedModule = mockFlexStackerModule({
            data: { platformState: 'extended', latchState: 'closed' },
        })
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus()
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('connected')
    })

    // Other Module Tests
    it('should return "calibrationBlocked" if module is attached but calibration is not complete', () => {
        const attachedModule = mockNonCalibratedAttachedModule()
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus({ complete: false })
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('calibrationBlocked')
    })

    it('should return "needsCalibration" if module is attached, calibration complete, but module offset is null', () => {
        const attachedModule = mockNonCalibratedAttachedModule(
            { moduleOffset: null }
        )
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus({ complete: true })
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('needsCalibration')
    })

    it('should return "needsCalibration" if module is attached, calibration complete, module offset is not null but lastModified field is null', () => {
        const attachedModule = mockNonCalibratedAttachedModule({
            moduleOffset: {
                offset: { x: 1, y: 2, z: 3 },
                slot: 'A1',
                last_modified: null,
            },
        })
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus({ complete: true })
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('needsCalibration')
    })

    it('should return "connected" for Absorbance Reader even if module offset is null', () => {
        const attachedModule = mockAbsorbanceReaderModule() // last_modified is null by default in mock
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus({ complete: true })
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('connected')
    })

    it('should return "connected" if module is attached, calibration complete, and module offset exists', () => {
        const attachedModule = mockCalibratedAttachedModule()
        const conflictedFixture = null
        const calibrationStatus = mockCalibrationStatus({ complete: true })
        const status = getModuleDisplayStatus(
            attachedModule,
            conflictedFixture,
            calibrationStatus
        )
        expect(status).toBe('connected')
    })

    // Note: Magnetic Block is filtered out before calling getModuleDisplayStatus,
    // so no specific test case is needed here unless the filtering logic changes.
})
