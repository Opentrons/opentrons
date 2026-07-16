import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useModuleCommandAnalytics } from '/app/redux-resources/analytics'

import { useVacuumModuleControls } from '../useVacuumModuleControls'

import type { AttachedModule } from '/app/redux/modules/types'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/analytics')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockVacuumModule = {
  id: 'vacuum_id',
  moduleModel: 'vacuumModuleV1',
  moduleType: 'vacuumModuleType',
  serialNumber: 'vac123',
  hardwareRevision: 'vacuum_v1.0',
  firmwareVersion: 'v1.0.0',
  hasAvailableUpdate: false,
  data: {
    currentPressure: null,
    targetPressure: null,
    currentPower: null,
    targetPower: null,
    ventStatus: 'closed',
    modeType: 'pressure',
    status: 'idle',
  },
  usbPort: { hub: 1, port: 4, path: '/dev/ot_module_vacuum0' },
} as any as AttachedModule

const mockNonVacuumModule = {
  id: 'tempdeck_id',
  moduleType: 'temperatureModuleType',
} as any as AttachedModule

describe('useVacuumModuleControls', () => {
  let mockCreateLiveCommand = vi.fn()
  let mockReportModuleCommand = vi.fn()

  beforeEach(() => {
    mockCreateLiveCommand = vi.fn()
    mockReportModuleCommand = vi.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    vi.mocked(useCreateLiveCommandMutation).mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    vi.mocked(useModuleCommandAnalytics).mockReturnValue({
      reportModuleCommand: mockReportModuleCommand,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return noop functions for non-vacuum module types', () => {
    const { result } = renderHook(() =>
      useVacuumModuleControls(mockNonVacuumModule)
    )

    act(() => {
      result.current.setVacuumPressure(500)
      result.current.setVacuumPower(75)
      result.current.deactivateVacuum()
      result.current.openVent()
      result.current.closeVent()
    })

    expect(mockCreateLiveCommand).not.toHaveBeenCalled()
  })

  describe('setVacuumPressure', () => {
    it('should create setTargetPressure command', () => {
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.setVacuumPressure(500)
      })

      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'vacuumModule/startSetVacuumPressure',
          params: {
            moduleId: 'vacuum_id',
            gaugePressure: 500,
          },
        },
      })
    })
  })

  describe('setVacuumPower', () => {
    it('should create setTargetPower command', () => {
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.setVacuumPower(75)
      })

      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'vacuumModule/startSetVacuumPower',
          params: {
            moduleId: 'vacuum_id',
            percentPower: 75,
          },
        },
      })
    })
  })

  describe('deactivateVacuum', () => {
    it('should create deactivate command', () => {
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.deactivateVacuum()
      })

      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'vacuumModule/stopVacuum',
          params: {
            moduleId: 'vacuum_id',
          },
        },
      })
    })
  })

  describe('openVent', () => {
    it('should create openVent command', () => {
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.openVent()
      })

      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'vacuumModule/openVent',
          params: {
            moduleId: 'vacuum_id',
          },
        },
      })
    })
  })

  describe('closeVent', () => {
    it('should create closeVent command', () => {
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.closeVent()
      })

      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'vacuumModule/closeVent',
          params: {
            moduleId: 'vacuum_id',
          },
        },
      })
    })
  })

  describe('analytics reporting', () => {
    it('should report successful command analytics on success', async () => {
      mockCreateLiveCommand.mockResolvedValue(null)
      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.deactivateVacuum()
      })

      await waitFor(() => {
        expect(mockReportModuleCommand).toHaveBeenCalledWith({
          kind: 'liveCommand',
          moduleType: 'vacuumModuleType',
          analyticCommand: 'vacuumModule/stopVacuum',
          result: { status: 'succeeded', data: undefined },
          serialNumber: 'vac123',
          errorDetails: '',
          firmwareVersion: 'v1.0.0',
        })
      })
    })

    it('should report failed command analytics and log error on failure', async () => {
      const mockError = new Error('Command failed')
      mockCreateLiveCommand.mockRejectedValue(mockError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() =>
        useVacuumModuleControls(mockVacuumModule)
      )

      act(() => {
        result.current.openVent()
      })

      await waitFor(() => {
        expect(mockReportModuleCommand).toHaveBeenCalledWith({
          kind: 'liveCommand',
          moduleType: 'vacuumModuleType',
          analyticCommand: 'vacuumModule/openVent',
          result: { status: 'failed', data: undefined },
          errorDetails: 'Command failed',
          serialNumber: 'vac123',
          firmwareVersion: 'v1.0.0',
        })
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'error setting module status with command type vacuumModule/openVent: Command failed'
      )

      consoleSpy.mockRestore()
    })
  })
})
