import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  moduleInitDuringLPCCommands,
  moveToWellCommands,
  savePositionCommands,
} from '../commands'
import { useHandleConfirmLwModulePlacement } from '../useHandleConfirmLwModulePlacement'

vi.mock('../commands')

describe('useHandleConfirmLwModulePlacement', () => {
  const mockSetErrorMessage = vi.fn()
  const mockChainLPCCommands = vi.fn()
  const mockAnalysis = {}

  const mockProps = {
    setErrorMessage: mockSetErrorMessage,
    chainLPCCommands: mockChainLPCCommands,
    analysis: mockAnalysis,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockPipetteId = 'pipette-123'
  const mockInitialVectorOffset = { x: 1, y: 2, z: 3 }
  const mockPosition = { x: 10, y: 20, z: 30 }

  const mockOffsetLocationDetails = {
    labwareId: 'labware-456',
    well: 'A1',
    addressableAreaName: 'C2',
    lwModOnlyStackupDetails: [
      { kind: 'module', id: 'module-789' },
      { kind: 'labware', id: 'labware-456' },
      { kind: 'labware', id: 'labware-457' },
    ],
  } as any

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(moduleInitDuringLPCCommands).mockImplementation(analysis => [
      {
        commandType: 'moduleInitDuringLPC',
        params: { analysis },
      } as any,
    ])

    vi.mocked(moveToWellCommands).mockImplementation(
      (offsetDetails, pipetteId, vectorOffset) => [
        {
          commandType: 'moveToWell',
          params: {
            pipetteId,
            offsetLocationDetails: offsetDetails,
            offset: vectorOffset,
          },
        } as any,
      ]
    )

    vi.mocked(savePositionCommands).mockImplementation(pipetteId => [
      {
        commandType: 'savePosition',
        params: { pipetteId },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue([
      { data: { commandType: 'moveLabware' } },
      { data: { commandType: 'moduleInitDuringLPC' } },
      { data: { commandType: 'moveToWell' } },
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

  it('should return handleConfirmLwModulePlacement function', () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    expect(result.current).toHaveProperty('handleConfirmLwModulePlacement')
    expect(typeof result.current.handleConfirmLwModulePlacement).toBe(
      'function'
    )
  })

  it('should chain commands in the correct order when handleConfirmLwModulePlacement is called', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    const position = await result.current.handleConfirmLwModulePlacement(
      mockOffsetLocationDetails,
      mockPipetteId,
      mockInitialVectorOffset
    )

    expect(moduleInitDuringLPCCommands).toHaveBeenCalledWith(mockAnalysis)
    expect(moveToWellCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails,
      mockPipetteId,
      mockInitialVectorOffset
    )
    expect(savePositionCommands).toHaveBeenCalledWith(mockPipetteId)

    expect(mockChainLPCCommands).toHaveBeenCalled()
    const commandsArg = mockChainLPCCommands.mock.calls[0][0]

    const moveLabwareCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'moveLabware'
    )
    expect(moveLabwareCommands.length).toBe(2)

    expect(moveLabwareCommands[0]).toEqual({
      commandType: 'moveLabware',
      params: {
        labwareId: 'labware-456',
        newLocation: { moduleId: 'module-789' },
        strategy: 'manualMoveWithoutPause',
      },
    })

    expect(moveLabwareCommands[1]).toEqual({
      commandType: 'moveLabware',
      params: {
        labwareId: 'labware-457',
        newLocation: { labwareId: 'labware-456' },
        strategy: 'manualMoveWithoutPause',
      },
    })

    expect(position).toEqual(mockPosition)
  })

  it('should chain commands in the correct order when handleMoveToInitialOffsetPosition is called', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    const position = await result.current.handleMoveToInitialOffsetPosition(
      mockOffsetLocationDetails,
      mockPipetteId,
      mockInitialVectorOffset
    )

    expect(moveToWellCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails,
      mockPipetteId,
      mockInitialVectorOffset
    )
    expect(savePositionCommands).toHaveBeenCalledWith(mockPipetteId)

    expect(mockChainLPCCommands).toHaveBeenCalled()
    const commandsArg = mockChainLPCCommands.mock.calls[0][0]

    expect(commandsArg.length).toBe(2)
    expect(commandsArg[0].commandType).toBe('moveToWell')
    expect(commandsArg[1].commandType).toBe('savePosition')

    expect(position).toEqual(mockPosition)
  })

  it('should handle labware placement on deck when no module or labware beneath', async () => {
    const mockOffsetLocationDetailsNoPriorItem = {
      ...mockOffsetLocationDetails,
      lwModOnlyStackupDetails: [{ kind: 'labware', id: 'standalone-labware' }],
      addressableAreaName: 'C2',
    } as any

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await result.current.handleConfirmLwModulePlacement(
      mockOffsetLocationDetailsNoPriorItem,
      mockPipetteId
    )

    const commandsArg = mockChainLPCCommands.mock.calls[0][0]
    const moveLabwareCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'moveLabware'
    )

    expect(moveLabwareCommands[0]).toEqual({
      commandType: 'moveLabware',
      params: {
        labwareId: 'standalone-labware',
        newLocation: { addressableAreaName: 'C2' },
        strategy: 'manualMoveWithoutPause',
      },
    })
  })

  it('should reject with error when final command response is incorrect for handleConfirmLwModulePlacement', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      { data: { commandType: 'moveLabware' } },
      { data: { commandType: 'moduleInitDuringLPC' } },
      { data: { commandType: 'moveToWell' } },
      {
        data: {
          commandType: 'unknownCommand',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await expect(
      result.current.handleConfirmLwModulePlacement(
        mockOffsetLocationDetails,
        mockPipetteId
      )
    ).rejects.toThrow(
      'CheckItem failed to save position for initial placement.'
    )

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save position for initial placement.'
    )
  })

  it('should reject with error when final command response is incorrect for handleMoveToInitialOffsetPosition', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      { data: { commandType: 'moveToWell' } },
      {
        data: {
          commandType: 'unknownCommand',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await expect(
      result.current.handleMoveToInitialOffsetPosition(
        mockOffsetLocationDetails,
        mockPipetteId,
        mockInitialVectorOffset
      )
    ).rejects.toThrow(
      'CheckItem failed to save position for initial placement.'
    )

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save position for initial placement.'
    )
  })

  it('should reject with error when result is null', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      { data: { commandType: 'moveLabware' } },
      { data: { commandType: 'moduleInitDuringLPC' } },
      { data: { commandType: 'moveToWell' } },
      {
        data: {
          commandType: 'savePosition',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await expect(
      result.current.handleConfirmLwModulePlacement(
        mockOffsetLocationDetails,
        mockPipetteId
      )
    ).rejects.toThrow(
      'CheckItem failed to save position for initial placement.'
    )

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save position for initial placement.'
    )
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await expect(
      result.current.handleConfirmLwModulePlacement(
        mockOffsetLocationDetails,
        mockPipetteId
      )
    ).rejects.toThrow('Command chain failed')
  })

  it('should not include module components in moveLabware commands', async () => {
    const mockOffsetLocationDetailsWithMultipleModules = {
      ...mockOffsetLocationDetails,
      lwModOnlyStackupDetails: [
        { kind: 'module', id: 'module-789' },
        { kind: 'module', id: 'module-790' },
        { kind: 'labware', id: 'labware-456' },
      ],
    } as any

    const { result } = renderHook(() =>
      useHandleConfirmLwModulePlacement(mockProps)
    )

    await result.current.handleConfirmLwModulePlacement(
      mockOffsetLocationDetailsWithMultipleModules,
      mockPipetteId
    )

    const commandsArg = mockChainLPCCommands.mock.calls[0][0]
    const moveLabwareCommands = commandsArg.filter(
      (cmd: any) => cmd.commandType === 'moveLabware'
    )

    expect(moveLabwareCommands.length).toBe(1)
    expect(moveLabwareCommands[0].params.labwareId).toBe('labware-456')
    expect(moveLabwareCommands[0].params.newLocation).toEqual({
      moduleId: 'module-790',
    })
  })
})
