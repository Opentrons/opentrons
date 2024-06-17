import { vi, it, describe, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { useChainRunCommands } from '../../../../resources/runs'
import {
  useRecoveryCommands,
  HOME_PIPETTE_Z_AXES,
  buildPickUpTips,
} from '../useRecoveryCommands'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../resources/runs')

const mockFailedCommand = {
  id: 'MOCK_ID',
  commandType: 'mockCommandType',
  params: { test: 'mock_param' },
} as any
const mockRunId = '123'
const mockFailedLabwareUtils = {
  selectedTipLocations: { A1: null },
  pickUpTipLabware: { id: 'MOCK_LW_ID' },
} as any

describe('useRecoveryCommands', () => {
  const mockResumeRunFromRecovery = vi.fn()
  const mockStopRun = vi.fn()
  const mockChainRunCommands = vi.fn().mockResolvedValue([])

  beforeEach(() => {
    vi.mocked(useResumeRunFromRecoveryMutation).mockReturnValue({
      resumeRunFromRecovery: mockResumeRunFromRecovery,
    } as any)
    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: mockChainRunCommands,
    } as any)
  })

  it('should call chainRunRecoveryCommands with continuePastCommandFailure set to true', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    await act(async () => {
      await result.current.homePipetteZAxes() // can use any result returned command
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [HOME_PIPETTE_Z_AXES],
      true
    )
  })

  it('should call retryFailedCommand with the failedCommand', async () => {
    const expectedNewCommand = {
      commandType: mockFailedCommand.commandType,
      params: mockFailedCommand.params,
    }

    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    await act(async () => {
      await result.current.retryFailedCommand()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [expectedNewCommand],
      true
    )
  })

  it('should call resumeRun with runId', () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    result.current.resumeRun()

    expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
  })

  it('should call cancelRun with runId', () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    result.current.cancelRun()

    expect(mockStopRun).toHaveBeenCalledWith(mockRunId)
  })

  it('should call homePipetteZAxes with the appropriate command', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    await act(async () => {
      await result.current.homePipetteZAxes()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [HOME_PIPETTE_Z_AXES],
      true
    )
  })

  it('should call pickUpTips with the appropriate command', async () => {
    const mockFailedCmdWithPipetteId = {
      ...mockFailedCommand,
      params: { ...mockFailedCommand.params, pipetteId: 'MOCK_ID' },
    }

    const buildPickUpTipsCmd = buildPickUpTips(
      mockFailedLabwareUtils.selectedTipLocations,
      mockFailedCmdWithPipetteId,
      mockFailedLabwareUtils.pickUpTipLabware
    )

    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCmdWithPipetteId,
        failedLabwareUtils: mockFailedLabwareUtils,
      })
    )

    await act(async () => {
      await result.current.pickUpTips()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [buildPickUpTipsCmd],
      true
    )
  })
})
