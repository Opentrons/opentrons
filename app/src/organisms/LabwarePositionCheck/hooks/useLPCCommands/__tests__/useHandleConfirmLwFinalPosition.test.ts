import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  moduleCleanupDuringLPCCommands,
  moveLabwareOffDeckCommands,
  retractPipetteAxesSequentiallyCommands,
  savePositionCommands,
} from '../commands'
import { useHandleConfirmLwFinalPosition } from '../useHandleConfirmLwFinalPosition'

vi.mock('../commands')

describe('useHandleConfirmLwFinalPosition', () => {
  const mockSetErrorMessage = vi.fn()
  const mockChainLPCCommands = vi.fn()

  const mockProps = {
    setErrorMessage: mockSetErrorMessage,
    chainLPCCommands: mockChainLPCCommands,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockPipette = {
    id: 'pipette-123',
    mount: 'left',
    pipetteName: 'mock_pipette_name',
  } as any

  const mockOffsetLocationDetails = {
    labwareId: 'labware-456',
    kind: 'default',
    addressableAreaName: 'C2',
    closestBeneathModuleId: 'module-789',
  } as any

  const mockPosition = { x: 10, y: 20, z: 30 }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(savePositionCommands).mockImplementation(pipetteId => [
      {
        commandType: 'savePosition',
        params: { pipetteId },
      } as any,
    ])

    vi.mocked(retractPipetteAxesSequentiallyCommands).mockImplementation(
      pipette => [
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: pipette?.id },
        } as any,
      ]
    )

    vi.mocked(moduleCleanupDuringLPCCommands).mockImplementation(
      offsetDetails => [
        {
          commandType: 'moduleCleanupDuringLPC',
          params: {
            closestBeneathModuleId: offsetDetails.closestBeneathModuleId,
          },
        } as any,
      ]
    )

    vi.mocked(moveLabwareOffDeckCommands).mockImplementation(offsetDetails => [
      {
        commandType: 'moveLabwareOffDeck',
        params: { labwareId: offsetDetails.labwareId },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue([
      {
        data: {
          commandType: 'savePosition',
          result: {
            position: mockPosition,
          },
        },
      },
    ])
  })

  it('should return handleConfirmLwFinalPosition and handlePostConfirmCleanup', () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    expect(result.current).toHaveProperty('handleConfirmLwFinalPosition')
    expect(result.current).toHaveProperty('handlePostConfirmCleanup')
    expect(result.current.hasPendingPostConfirmCleanup).toBe(false)
    expect(typeof result.current.handleConfirmLwFinalPosition).toBe('function')
    expect(typeof result.current.handlePostConfirmCleanup).toBe('function')
  })

  it('should only chain savePosition when handleConfirmLwFinalPosition is called', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    const position = await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )

    expect(savePositionCommands).toHaveBeenCalledWith(mockPipette.id)
    expect(retractPipetteAxesSequentiallyCommands).not.toHaveBeenCalled()
    expect(moduleCleanupDuringLPCCommands).not.toHaveBeenCalled()
    expect(moveLabwareOffDeckCommands).not.toHaveBeenCalled()

    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [{ commandType: 'savePosition', params: { pipetteId: mockPipette.id } }],
      false
    )

    expect(position).toEqual(mockPosition)
    await waitFor(() => {
      expect(result.current.hasPendingPostConfirmCleanup).toBe(true)
    })
  })

  it('should chain retract and cleanup when handlePostConfirmCleanup is called', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )
    mockChainLPCCommands.mockClear()
    mockChainLPCCommands.mockResolvedValueOnce([])

    await result.current.handlePostConfirmCleanup()

    expect(retractPipetteAxesSequentiallyCommands).toHaveBeenCalledWith(
      mockPipette
    )
    expect(moduleCleanupDuringLPCCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails
    )
    expect(moveLabwareOffDeckCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails
    )

    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: mockPipette.id },
        },
        {
          commandType: 'moduleCleanupDuringLPC',
          params: {
            closestBeneathModuleId:
              mockOffsetLocationDetails.closestBeneathModuleId,
          },
        },
        {
          commandType: 'moveLabwareOffDeck',
          params: { labwareId: mockOffsetLocationDetails.labwareId },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(result.current.hasPendingPostConfirmCleanup).toBe(false)
    })
  })

  it('should reuse the captured pose when cleanup fails and confirm is retried', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    const firstPosition = await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )

    mockChainLPCCommands.mockRejectedValueOnce(new Error('door open'))
    await expect(result.current.handlePostConfirmCleanup()).rejects.toThrow(
      'door open'
    )
    await waitFor(() => {
      expect(result.current.hasPendingPostConfirmCleanup).toBe(true)
    })

    mockChainLPCCommands.mockClear()
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'savePosition',
          result: { position: { x: 1, y: 2, z: 250 } },
        },
      },
    ])

    const retryPosition = await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )

    expect(retryPosition).toEqual(firstPosition)
    expect(mockChainLPCCommands).not.toHaveBeenCalled()
  })

  it('should recapture after cleanup succeeds', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )
    mockChainLPCCommands.mockResolvedValueOnce([])
    await result.current.handlePostConfirmCleanup()

    const nextPosition = { x: 4, y: 5, z: 6 }
    mockChainLPCCommands.mockClear()
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'savePosition',
          result: { position: nextPosition },
        },
      },
    ])

    const position = await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )

    expect(position).toEqual(nextPosition)
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [{ commandType: 'savePosition', params: { pipetteId: mockPipette.id } }],
      false
    )
  })

  it('should no-op cleanup when nothing is pending', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await result.current.handlePostConfirmCleanup()

    expect(mockChainLPCCommands).not.toHaveBeenCalled()
  })

  it('should reject with error when command response is incorrect', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'unknownCommand',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('CheckItem failed to save final position.')

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save final position.'
    )
  })

  it('should reject with error when result is null', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'savePosition',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('CheckItem failed to save final position.')

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save final position.'
    )
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('Command chain failed')
  })
})
