import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import { useMonitorMaintenanceRunForDeletion } from '../useMonitorMaintenanceRunForDeletion'

vi.mock('/app/resources/maintenance_runs')

describe('useMonitorMaintenanceRunForDeletion', () => {
  const MAINTENANCE_RUN_ID = 'maintenance-run-123'
  const DIFFERENT_MAINTENANCE_RUN_ID = 'maintenance-run-456'
  const mockSetMaintenanceRunId = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)
  })

  it('should not enable monitoring when maintenanceRunId is null', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)

    renderHook(() => {
      useMonitorMaintenanceRunForDeletion({
        maintenanceRunId: null,
        setMaintenanceRunId: mockSetMaintenanceRunId,
      })
    })

    expect(useNotifyCurrentMaintenanceRun).toHaveBeenCalledWith({
      refetchInterval: 5000,
      enabled: false,
    })
    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()
  })

  it('should enable monitoring when maintenanceRunId is not null', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)

    renderHook(() => {
      useMonitorMaintenanceRunForDeletion({
        maintenanceRunId: MAINTENANCE_RUN_ID,
        setMaintenanceRunId: mockSetMaintenanceRunId,
      })
    })

    expect(useNotifyCurrentMaintenanceRun).toHaveBeenCalledWith({
      refetchInterval: 5000,
      enabled: true,
    })
  })

  it('should not call setMaintenanceRunId when data is not yet available', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)

    renderHook(() => {
      useMonitorMaintenanceRunForDeletion({
        maintenanceRunId: MAINTENANCE_RUN_ID,
        setMaintenanceRunId: mockSetMaintenanceRunId,
      })
    })

    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()
  })

  it('should not call setMaintenanceRunId when maintenanceRunId matches current run ID', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: MAINTENANCE_RUN_ID,
        },
      },
    } as any)

    const { rerender } = renderHook(
      props => {
        useMonitorMaintenanceRunForDeletion({
          maintenanceRunId: props.maintenanceRunId,
          setMaintenanceRunId: mockSetMaintenanceRunId,
        })
      },
      {
        initialProps: { maintenanceRunId: MAINTENANCE_RUN_ID },
      }
    )

    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()

    rerender({ maintenanceRunId: MAINTENANCE_RUN_ID })
    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()
  })

  it('should call setMaintenanceRunId with null when run IDs differ after monitoring started', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: MAINTENANCE_RUN_ID,
        },
      },
    } as any)

    const { rerender } = renderHook(
      props => {
        useMonitorMaintenanceRunForDeletion({
          maintenanceRunId: props.maintenanceRunId,
          setMaintenanceRunId: mockSetMaintenanceRunId,
        })
      },
      {
        initialProps: { maintenanceRunId: MAINTENANCE_RUN_ID },
      }
    )

    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()

    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: DIFFERENT_MAINTENANCE_RUN_ID,
        },
      },
    } as any)

    rerender({ maintenanceRunId: MAINTENANCE_RUN_ID })
    expect(mockSetMaintenanceRunId).toHaveBeenCalledWith(null)
  })

  it('should handle transition from null to valid maintenanceRunId', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)

    const { rerender } = renderHook(
      props => {
        useMonitorMaintenanceRunForDeletion({
          maintenanceRunId: props.maintenanceRunId,
          setMaintenanceRunId: mockSetMaintenanceRunId,
        })
      },
      {
        initialProps: { maintenanceRunId: null },
      }
    )

    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()

    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: MAINTENANCE_RUN_ID,
        },
      },
    } as any)

    rerender({ maintenanceRunId: MAINTENANCE_RUN_ID } as any)
    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()
  })

  it('should handle transition from valid maintenanceRunId to null', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: MAINTENANCE_RUN_ID,
        },
      },
    } as any)

    const { rerender } = renderHook(
      props => {
        useMonitorMaintenanceRunForDeletion({
          maintenanceRunId: props.maintenanceRunId,
          setMaintenanceRunId: mockSetMaintenanceRunId,
        })
      },
      {
        initialProps: { maintenanceRunId: MAINTENANCE_RUN_ID },
      }
    )

    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()

    rerender({ maintenanceRunId: null } as any)
    expect(mockSetMaintenanceRunId).not.toHaveBeenCalled()
  })
})
