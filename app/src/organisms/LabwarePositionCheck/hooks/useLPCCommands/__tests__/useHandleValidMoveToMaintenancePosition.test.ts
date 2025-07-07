import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { moveToMaintenancePosition } from '../commands'
import { useHandleValidMoveToMaintenancePosition } from '../useHandleValidMoveToMaintenancePosition'

vi.mock('../commands')

describe('useHandleValidMoveToMaintenancePosition', () => {
  const mockChainLPCCommands = vi.fn()

  const mockProps = {
    chainLPCCommands: mockChainLPCCommands,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockPipette = {
    id: 'pipette-123',
    mount: 'left',
    pipetteName: 'mock_pipette_name',
  } as any

  const mockCommandData = [
    {
      data: {
        commandType: 'moveToMaintenancePosition',
        result: { success: true },
      },
    },
  ]

  beforeEach(() => {
    vi.mocked(moveToMaintenancePosition).mockImplementation(pipette => [
      {
        commandType: 'moveToMaintenancePosition',
        params: { pipetteId: pipette?.id },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue(mockCommandData)
  })

  it('should return handleValidMoveToMaintenancePosition function', () => {
    const { result } = renderHook(() =>
      useHandleValidMoveToMaintenancePosition(mockProps)
    )

    expect(result.current).toHaveProperty(
      'handleValidMoveToMaintenancePosition'
    )
    expect(typeof result.current.handleValidMoveToMaintenancePosition).toBe(
      'function'
    )
  })

  it('should call chainLPCCommands with commands from moveToMaintenancePosition', async () => {
    const { result } = renderHook(() =>
      useHandleValidMoveToMaintenancePosition(mockProps)
    )

    const response = await result.current.handleValidMoveToMaintenancePosition(
      mockPipette
    )

    expect(moveToMaintenancePosition).toHaveBeenCalledWith(mockPipette)
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'moveToMaintenancePosition',
          params: { pipetteId: mockPipette.id },
        },
      ],
      false
    )
    expect(response).toEqual(mockCommandData)
  })

  it('should handle null pipette', async () => {
    const { result } = renderHook(() =>
      useHandleValidMoveToMaintenancePosition(mockProps)
    )

    await result.current.handleValidMoveToMaintenancePosition(null)

    expect(moveToMaintenancePosition).toHaveBeenCalledWith(null)
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'moveToMaintenancePosition',
          params: { pipetteId: undefined },
        },
      ],
      false
    )
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() =>
      useHandleValidMoveToMaintenancePosition(mockProps)
    )

    await expect(
      result.current.handleValidMoveToMaintenancePosition(mockPipette)
    ).rejects.toThrow('Command chain failed')
  })
})
