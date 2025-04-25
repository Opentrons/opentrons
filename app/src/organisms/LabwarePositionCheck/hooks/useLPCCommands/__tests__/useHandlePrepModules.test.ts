import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { modulePrepCommands } from '../commands'
import { useHandlePrepModules } from '../useHandlePrepModules'

vi.mock('../commands')

describe('useHandlePrepModules', () => {
  const mockChainLPCCommands = vi.fn()

  const mockProps = {
    chainLPCCommands: mockChainLPCCommands,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockOffsetLocationDetails = {
    labwareId: 'labware-456',
    closestBeneathModuleId: 'module-789',
  } as any

  const mockCommandData = [
    { data: { commandType: 'mockPrepModule', result: { success: true } } },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(modulePrepCommands).mockImplementation(offsetDetails => [
      {
        commandType: 'mockPrepModule',
        params: { moduleId: offsetDetails.closestBeneathModuleId },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue(mockCommandData)
  })

  it('should return handleCheckItemsPrepModules function', () => {
    const { result } = renderHook(() => useHandlePrepModules(mockProps))

    expect(result.current).toHaveProperty('handleCheckItemsPrepModules')
    expect(typeof result.current.handleCheckItemsPrepModules).toBe('function')
  })

  it('should call chainLPCCommands with prep commands when handleCheckItemsPrepModules is called', async () => {
    const { result } = renderHook(() => useHandlePrepModules(mockProps))

    const commandData = await result.current.handleCheckItemsPrepModules(
      mockOffsetLocationDetails
    )

    expect(modulePrepCommands).toHaveBeenCalledWith(mockOffsetLocationDetails)
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'mockPrepModule',
          params: {
            moduleId: mockOffsetLocationDetails.closestBeneathModuleId,
          },
        },
      ],
      false
    )
    expect(commandData).toEqual(mockCommandData)
  })

  it('should not call chainLPCCommands when there are no prep commands', async () => {
    vi.mocked(modulePrepCommands).mockReturnValueOnce([])

    const { result } = renderHook(() => useHandlePrepModules(mockProps))

    const commandData = await result.current.handleCheckItemsPrepModules(
      mockOffsetLocationDetails
    )

    expect(modulePrepCommands).toHaveBeenCalledWith(mockOffsetLocationDetails)
    expect(mockChainLPCCommands).not.toHaveBeenCalled()
    expect(commandData).toEqual([])
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useHandlePrepModules(mockProps))

    await expect(
      result.current.handleCheckItemsPrepModules(mockOffsetLocationDetails)
    ).rejects.toThrow('Command chain failed')
  })
})
