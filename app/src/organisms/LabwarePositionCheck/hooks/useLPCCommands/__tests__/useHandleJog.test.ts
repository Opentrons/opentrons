import { useSelector } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'

import { selectActivePipette } from '/app/redux/protocol-runs'

import { moveRelativeCommand, moveToWellCommands } from '../commands'
import { useHandleJog } from '../useHandleJog'

vi.mock('react-redux')
vi.mock('/app/redux/protocol-runs')
vi.mock('@opentrons/react-api-client')
vi.mock('../commands')

describe('useHandleJog', () => {
  vi.useFakeTimers()

  const mockPipetteId = 'mock_pipette'
  const mockRunId = 'mock_run'
  const mockMaintenanceRunId = 'mock_maintenance_run'
  const mockSetErrorMessage = vi.fn()
  const mockChainLPCCommands = vi.fn(() => Promise.resolve())
  const mockCreateSilentCommand = vi.fn()

  const mockCommandResult = {
    data: {
      result: {
        position: { x: 10, y: 20, z: 30 },
      },
    },
  }
  const mockProps = {
    runId: mockRunId,
    maintenanceRunId: mockMaintenanceRunId,
    setErrorMessage: mockSetErrorMessage,
    chainLPCCommands: mockChainLPCCommands,
  } as any
  const mockPipette = {
    id: mockPipetteId,
    pipetteName: 'p1000_single',
  } as any

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(moveRelativeCommand).mockImplementation(
      ({ pipetteId, axis, dir, step }) =>
        ({
          commandType: 'moveRelative',
          params: { pipetteId, axis, dir, step },
        } as any)
    )
    vi.mocked(moveToWellCommands).mockImplementation(
      (offsetLocationDetails, pipetteId, offset) => [
        {
          commandType: 'moveToWell',
          params: { pipetteId, offsetLocationDetails, offset } as any,
        },
      ]
    )
    vi.mocked(selectActivePipette).mockReturnValue(() => mockPipette)
    vi.mocked(useSelector).mockImplementation(fn => fn(fn))
    vi.mocked(useCreateMaintenanceCommandMutation).mockReturnValue({
      createMaintenanceCommand: mockCreateSilentCommand,
    } as any)
    mockCreateSilentCommand.mockResolvedValue(mockCommandResult)
  })

  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useHandleJog(mockProps))

    expect(result.current).toHaveProperty('handleJog')
    expect(result.current).toHaveProperty('resetJog')
  })

  it('should issue a jog command when handleJog is called', async () => {
    const { result } = renderHook(() => useHandleJog(mockProps))
    const mockOnSuccess = vi.fn()

    act(() => {
      result.current.handleJog('x', 1, 1, mockOnSuccess)
    })

    vi.runAllTimers()

    expect(mockCreateSilentCommand).toHaveBeenCalledWith({
      maintenanceRunId: mockMaintenanceRunId,
      command: {
        commandType: 'moveRelative',
        params: { pipetteId: mockPipetteId, axis: 'x', dir: 1, step: 1 },
      },
      waitUntilComplete: true,
      timeout: 10000,
    })

    await vi.runAllTimersAsync()

    expect(mockOnSuccess).toHaveBeenCalledWith({ x: 10, y: 20, z: 30 })
  })

  it('should queue multiple jog commands and process them sequentially', async () => {
    const { result } = renderHook(() => useHandleJog(mockProps))

    mockCreateSilentCommand.mockClear()

    act(() => {
      result.current.handleJog('x', 1, 1)
    })

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)
    expect(mockCreateSilentCommand.mock.calls[0][0].command.params).toEqual({
      pipetteId: mockPipetteId,
      axis: 'x',
      dir: 1,
      step: 1,
    })

    mockCreateSilentCommand.mockClear()

    act(() => {
      result.current.handleJog('y', -1, 1)
    })

    await vi.runAllTimersAsync()

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)
    expect(mockCreateSilentCommand.mock.calls[0][0].command.params).toEqual({
      pipetteId: mockPipetteId,
      axis: 'y',
      dir: -1,
      step: 1,
    })

    mockCreateSilentCommand.mockClear()

    act(() => {
      result.current.handleJog('z', 1, 0.1)
    })

    await vi.runAllTimersAsync()

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)
    expect(mockCreateSilentCommand.mock.calls[0][0].command.params).toEqual({
      pipetteId: mockPipetteId,
      axis: 'z',
      dir: 1,
      step: 0.1,
    })
  })

  it('should limit the queue to MAX_QUEUED_JOGS (3) commands plus the command that runs immediately', async () => {
    const { result } = renderHook(() => useHandleJog(mockProps))

    mockCreateSilentCommand.mockClear()

    await act(async () => {
      result.current.handleJog('x', 1, 1)
      result.current.handleJog('y', -1, 1)
      result.current.handleJog('z', 1, 1)
      result.current.handleJog('x', -1, 1)
      result.current.handleJog('x', -1, 1)
      result.current.handleJog('x', 1, 1)
      result.current.handleJog('x', -1, 1)
    })

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)

    await vi.runAllTimersAsync()

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(4)
  })

  it('should set error message when command fails', async () => {
    const mockError = new Error('Command failed')
    mockCreateSilentCommand.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useHandleJog(mockProps))

    act(() => {
      result.current.handleJog('x', 1, 1)
    })

    await vi.runAllTimersAsync()

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'Error issuing jog command: Command failed'
    )
  })

  it('should set error message when pipette is not found', async () => {
    vi.mocked(selectActivePipette).mockReturnValueOnce(() => null)

    const { result } = renderHook(() => useHandleJog(mockProps))

    act(() => {
      result.current.handleJog('x', 1, 1)
    })

    await vi.runAllTimersAsync()

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'Could not find pipette to jog with id: '
    )
  })

  it('should clear the queue when resetJog is called', async () => {
    const { result } = renderHook(() => useHandleJog(mockProps))
    const mockOffsetLocationDetails = { labwareId: 'lw-123', well: 'A1' } as any
    const mockOffset = { x: 1, y: 2, z: 3 }

    act(() => {
      result.current.handleJog('x', 1, 1)
      result.current.handleJog('y', -1, 1)
    })

    await act(async () => {
      await result.current.resetJog(
        mockOffsetLocationDetails,
        mockPipetteId,
        mockOffset
      )
    })

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)

    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: mockPipetteId,
            offsetLocationDetails: mockOffsetLocationDetails,
            offset: mockOffset,
          },
        },
      ],
      false
    )

    act(() => {
      result.current.handleJog('z', 1, 0.1)
    })

    await vi.runAllTimersAsync()

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(2)
  })

  it('should debounce rapid jog requests', async () => {
    const { result } = renderHook(() => useHandleJog(mockProps))

    act(() => {
      result.current.handleJog('x', 1, 1)
      result.current.handleJog('x', 1, 1)
      result.current.handleJog('x', 1, 1)
    })

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(1)

    await vi.runAllTimersAsync()

    expect(mockCreateSilentCommand).toHaveBeenCalledTimes(3)
  })

  it('should clean up debounce on unmount', () => {
    const { unmount } = renderHook(() => useHandleJog(mockProps))

    unmount()

    act(() => {
      vi.runAllTimers()
    })

    expect(mockCreateSilentCommand).not.toHaveBeenCalled()
  })
})
