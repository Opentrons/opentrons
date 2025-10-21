import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'

import { retractSafelyAndHomeCommands } from '../commands'
import { useHandleClose } from '../useHandleClose'

vi.mock('/app/resources/maintenance_runs')
vi.mock('../commands')

describe('useHandleClose', () => {
  const mockMaintenanceRunId = 'mock_maintenance_run'
  const mockOnCloseClick = vi.fn()
  const mockChainRunCommands = vi.fn(() => Promise.resolve())

  const mockProps = {
    maintenanceRunId: mockMaintenanceRunId,
    onCloseClick: mockOnCloseClick,
  } as any

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(retractSafelyAndHomeCommands).mockImplementation(() => [
      {
        commandType: 'retractSafelyAndHome',
        params: {},
      } as any,
    ])

    vi.mocked(useChainMaintenanceCommands).mockReturnValue({
      chainRunCommands: mockChainRunCommands,
    } as any)
  })

  it('should initialize with isExiting as false', () => {
    const { result } = renderHook(() => useHandleClose(mockProps))

    expect(result.current).toHaveProperty('isExiting', false)
    expect(result.current).toHaveProperty('handleHomeAndClose')
    expect(result.current).toHaveProperty('handleCloseNoHome')
  })

  it('should set isExiting to true and call chainRunCommands when handleHomeAndClose is called', async () => {
    const { result } = renderHook(() => useHandleClose(mockProps))

    await act(async () => {
      await result.current.handleHomeAndClose()
    })

    expect(result.current.isExiting).toBe(true)
    expect(mockChainRunCommands).toHaveBeenCalledWith(
      mockMaintenanceRunId,
      [{ commandType: 'retractSafelyAndHome', params: {} }],
      true
    )
    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('should call onCloseClick even if chainRunCommands fails', async () => {
    mockChainRunCommands.mockRejectedValueOnce(new Error('Command failed'))

    const { result } = renderHook(() => useHandleClose(mockProps))

    await act(async () => {
      await result.current.handleHomeAndClose()
    })

    expect(result.current.isExiting).toBe(true)
    expect(mockChainRunCommands).toHaveBeenCalled()
    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('should set isExiting to true and call onCloseClick when handleCloseNoHome is called', async () => {
    const { result } = renderHook(() => useHandleClose(mockProps))

    await act(async () => {
      result.current.handleCloseNoHome()
    })

    expect(result.current.isExiting).toBe(true)
    expect(mockChainRunCommands).not.toHaveBeenCalled()
    expect(mockOnCloseClick).toHaveBeenCalled()
  })
})
