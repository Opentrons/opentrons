import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fullHomeCommands,
  moduleInitBeforeAnyLPCCommands,
  moveToMaintenancePosition,
} from '../commands'
import { useHandleStartLPC } from '../useHandleStartLPC'
import { mapFlexStackerLabware } from '../utils'

vi.mock('../commands')
vi.mock('../utils')

describe('useHandleStartLPC', () => {
  const mockChainLPCCommands = vi.fn()
  const mockOnSuccess = vi.fn()

  const mockPipette = {
    id: 'pipette-123',
    mount: 'left',
    pipetteName: 'mock_pipette_name',
  } as any

  const mockAnalysis = {
    commands: [
      {
        commandType: 'loadPipette',
        params: { mount: 'left', pipetteName: 'mock_pipette_name' },
        result: { pipetteId: 'pipette-123' },
      },
      {
        commandType: 'loadLabware',
        params: { loadName: 'some_labware' },
        result: { labwareId: 'labware-456' },
      },
      {
        commandType: 'loadModule',
        params: { moduleType: 'magdeck' },
        result: { moduleId: 'module-789' },
      },
      {
        commandType: 'otherCommand',
        params: {},
      },
    ],
  } as any

  const mockProps = {
    chainLPCCommands: mockChainLPCCommands,
    analysis: mockAnalysis,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockStackerLabware = [
    {
      loadName: 'stacker_labware',
      labwareId: 'stacker-labware-001',
    },
  ] as any

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(fullHomeCommands).mockImplementation(() => [
      {
        commandType: 'fullHome',
        params: {},
      } as any,
    ])

    vi.mocked(moduleInitBeforeAnyLPCCommands).mockImplementation(analysis => [
      {
        commandType: 'moduleInitBeforeAnyLPC',
        params: { analysis },
      } as any,
    ])

    vi.mocked(moveToMaintenancePosition).mockImplementation(pipette => [
      {
        commandType: 'moveToMaintenancePosition',
        params: { pipetteId: pipette?.id },
      } as any,
    ])

    vi.mocked(mapFlexStackerLabware).mockReturnValue(mockStackerLabware)

    mockChainLPCCommands.mockResolvedValue([])
  })

  it('should return handleStartLPC function', () => {
    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    expect(result.current).toHaveProperty('handleStartLPC')
    expect(typeof result.current.handleStartLPC).toBe('function')
  })

  it('should chain commands in the correct order when handleStartLPC is called', async () => {
    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    await result.current.handleStartLPC(mockPipette, mockOnSuccess)

    expect(moduleInitBeforeAnyLPCCommands).toHaveBeenCalledWith(mockAnalysis)
    expect(fullHomeCommands).toHaveBeenCalled()
    expect(moveToMaintenancePosition).toHaveBeenCalledWith(mockPipette)
    expect(mapFlexStackerLabware).toHaveBeenCalledWith(mockAnalysis.commands)

    const commandsArg = mockChainLPCCommands.mock.calls[0][0]

    const loadPipetteCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadPipette'
    )
    expect(loadPipetteCommands.length).toBe(1)
    expect(loadPipetteCommands[0]).toHaveProperty(
      'params.pipetteId',
      'pipette-123'
    )
    expect(loadPipetteCommands[0]).toHaveProperty('params.mount', 'left')
    expect(loadPipetteCommands[0]).toHaveProperty(
      'params.pipetteName',
      'mock_pipette_name'
    )

    const loadLabwareCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadLabware'
    )
    expect(loadLabwareCommands.length).toBe(2)
    expect(loadLabwareCommands[0]).toHaveProperty(
      'params.labwareId',
      'labware-456'
    )
    expect(loadLabwareCommands[0]).toHaveProperty('params.location', 'offDeck')

    const stackerCommand = loadLabwareCommands.find(
      (cmd: any) => cmd.params.labwareId === 'stacker-labware-001'
    )
    expect(stackerCommand).toBeDefined()
    expect(stackerCommand).toHaveProperty('params.loadName', 'stacker_labware')
    expect(stackerCommand).toHaveProperty('params.location', 'offDeck')

    const loadModuleCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadModule'
    )
    expect(loadModuleCommands.length).toBe(1)
    expect(loadModuleCommands[0]).toHaveProperty(
      'params.moduleId',
      'module-789'
    )
    expect(loadModuleCommands[0]).toHaveProperty('params.moduleType', 'magdeck')

    expect(commandsArg).toContainEqual({
      commandType: 'moduleInitBeforeAnyLPC',
      params: { analysis: mockAnalysis },
    })

    expect(commandsArg).toContainEqual({
      commandType: 'fullHome',
      params: {},
    })

    expect(commandsArg).toContainEqual({
      commandType: 'moveToMaintenancePosition',
      params: { pipetteId: mockPipette.id },
    })

    expect(mockChainLPCCommands).toHaveBeenCalledWith(expect.any(Array), false)
  })

  it('should only include load commands and exclude other commands', async () => {
    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    await result.current.handleStartLPC(mockPipette, mockOnSuccess)

    const commandsArg = mockChainLPCCommands.mock.calls[0][0]

    const otherCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'otherCommand'
    )

    expect(otherCommands.length).toBe(0)
  })

  it('should call onSuccess when chainLPCCommands succeeds', async () => {
    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    await result.current.handleStartLPC(mockPipette, mockOnSuccess)

    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    await expect(
      result.current.handleStartLPC(mockPipette, mockOnSuccess)
    ).rejects.toThrow('Command chain failed')

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle null pipette', async () => {
    const { result } = renderHook(() => useHandleStartLPC(mockProps))

    await result.current.handleStartLPC(null, mockOnSuccess)

    expect(moveToMaintenancePosition).toHaveBeenCalledWith(null)
    expect(mockChainLPCCommands).toHaveBeenCalled()
    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should correctly process protocol with no commandType matches', async () => {
    const mockEmptyAnalysis = {
      commands: [
        {
          commandType: 'otherCommand',
          params: {},
        },
      ],
    } as any

    vi.mocked(mapFlexStackerLabware).mockReturnValueOnce([])

    const mockPropsWithEmptyAnalysis = {
      ...mockProps,
      analysis: mockEmptyAnalysis,
    }

    const { result } = renderHook(() =>
      useHandleStartLPC(mockPropsWithEmptyAnalysis)
    )

    await result.current.handleStartLPC(mockPipette, mockOnSuccess)

    const commandsArg = mockChainLPCCommands.mock.calls[0][0]

    const loadPipetteCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadPipette'
    )
    expect(loadPipetteCommands.length).toBe(0)

    const loadLabwareCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadLabware'
    )
    expect(loadLabwareCommands.length).toBe(0)

    const loadModuleCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'loadModule'
    )
    expect(loadModuleCommands.length).toBe(0)

    expect(mockChainLPCCommands).toHaveBeenCalled()
    expect(mockOnSuccess).toHaveBeenCalled()
  })
})
