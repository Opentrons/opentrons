import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fullHomeCommands,
  modulePrepCommands,
  moveLabwareOffDeckCommands,
} from '../commands'
import { useHandleResetLwModulesOnDeck } from '../useHandleResetLwModulesOnDeck'

vi.mock('../commands')

describe('useHandleResetLwModulesOnDeck', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(modulePrepCommands).mockImplementation(offsetDetails => [
      {
        commandType: 'modulePrepCommand',
        params: { moduleId: offsetDetails.closestBeneathModuleId },
      } as any,
    ])

    vi.mocked(fullHomeCommands).mockImplementation(() => [
      {
        commandType: 'home',
        params: {},
      } as any,
    ])

    vi.mocked(moveLabwareOffDeckCommands).mockImplementation(offsetDetails => [
      {
        commandType: 'moveLabwareOffDeck',
        params: { labwareId: offsetDetails.labwareId },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue([])
  })

  it('should return handleResetLwModulesOnDeck function', () => {
    const { result } = renderHook(() =>
      useHandleResetLwModulesOnDeck(mockProps)
    )

    expect(result.current).toHaveProperty('handleResetLwModulesOnDeck')
    expect(typeof result.current.handleResetLwModulesOnDeck).toBe('function')
  })

  it('should chain commands in the correct order when handleResetLwModulesOnDeck is called', async () => {
    const { result } = renderHook(() =>
      useHandleResetLwModulesOnDeck(mockProps)
    )

    await result.current.handleResetLwModulesOnDeck(mockOffsetLocationDetails)

    expect(modulePrepCommands).toHaveBeenCalledWith(mockOffsetLocationDetails)
    expect(fullHomeCommands).toHaveBeenCalled()
    expect(moveLabwareOffDeckCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails
    )

    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'modulePrepCommand',
          params: {
            moduleId: mockOffsetLocationDetails.closestBeneathModuleId,
          },
        },
        {
          commandType: 'home',
          params: {},
        },
        {
          commandType: 'moveLabwareOffDeck',
          params: { labwareId: mockOffsetLocationDetails.labwareId },
        },
      ],
      false
    )
  })

  it('should resolve with void when chainLPCCommands succeeds', async () => {
    const { result } = renderHook(() =>
      useHandleResetLwModulesOnDeck(mockProps)
    )

    const returnValue = await result.current.handleResetLwModulesOnDeck(
      mockOffsetLocationDetails
    )

    expect(returnValue).toBeUndefined()
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() =>
      useHandleResetLwModulesOnDeck(mockProps)
    )

    await expect(
      result.current.handleResetLwModulesOnDeck(mockOffsetLocationDetails)
    ).rejects.toThrow('Command chain failed')
  })
})
