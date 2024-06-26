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
import { RECOVERY_MAP } from '../../constants'

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
const mockProceedToRouteAndStep = vi.fn()
const mockRouteUpdateActions = {
  proceedToRouteAndStep: mockProceedToRouteAndStep,
} as any

describe('useRecoveryCommands', () => {
  const mockMakeSuccessToast = vi.fn()
  const mockResumeRunFromRecovery = vi.fn(() =>
    Promise.resolve(mockMakeSuccessToast())
  )
  const mockStopRun = vi.fn()
  const mockChainRunCommands = vi.fn().mockResolvedValue([])

  beforeEach(() => {
    vi.mocked(useResumeRunFromRecoveryMutation).mockReturnValue({
      mutateAsync: mockResumeRunFromRecovery,
    } as any)
    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: mockChainRunCommands,
    } as any)
  })

  it('should call chainRunRecoveryCommands with continuePastCommandFailure set to false', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    await act(async () => {
      await result.current.homePipetteZAxes() // can use any result returned command
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [HOME_PIPETTE_Z_AXES],
      false
    )
  })

  it(`should call proceedToRouteAndStep with ${RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE} when chainRunCommands throws an error`, async () => {
    const mockError = new Error('Mock error')
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: vi.fn().mockRejectedValue(mockError),
    } as any)

    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    await act(async () => {
      await expect(result.current.homePipetteZAxes()).rejects.toThrow(
        'Could not execute command: Error: Mock error'
      )
    })

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
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
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    await act(async () => {
      await result.current.retryFailedCommand()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [expectedNewCommand],
      false
    )
  })

  it('should call resumeRun with runId and show success toast on success', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: { makeSuccessToast: mockMakeSuccessToast } as any,
      })
    )

    await act(async () => {
      await result.current.resumeRun()
    })

    expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
    expect(mockMakeSuccessToast).toHaveBeenCalled()
  })

  it('should call cancelRun with runId', () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
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
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    await act(async () => {
      await result.current.homePipetteZAxes()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [HOME_PIPETTE_Z_AXES],
      false
    )
  })

  it('should call pickUpTips with the appropriate command', async () => {
    const mockFailedCmdWithPipetteId = {
      ...mockFailedCommand,
      params: { ...mockFailedCommand.params, pipetteId: 'MOCK_ID' },
    }

    const mockFailedLabware = {
      id: 'MOCK_LW_ID',
    } as any

    const buildPickUpTipsCmd = buildPickUpTips(
      mockFailedLabwareUtils.selectedTipLocations,
      mockFailedCmdWithPipetteId,
      mockFailedLabware
    )

    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCmdWithPipetteId,
        failedLabwareUtils: {
          ...mockFailedLabwareUtils,
          failedLabware: mockFailedLabware,
        },
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
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

  it('should call skipFailedCommand and resolve after a timeout', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    const consoleSpy = vi.spyOn(console, 'log')

    await act(async () => {
      await result.current.skipFailedCommand()
    })

    expect(consoleSpy).toHaveBeenCalledWith('SKIPPING TO NEXT STEP')
    expect(result.current.skipFailedCommand()).resolves.toBeUndefined()
  })

  it('should call ignoreErrorKindThisRun and resolve immediately', async () => {
    const { result } = renderHook(() =>
      useRecoveryCommands({
        runId: mockRunId,
        failedCommand: mockFailedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
      })
    )

    const consoleSpy = vi.spyOn(console, 'log')

    await act(async () => {
      await result.current.ignoreErrorKindThisRun()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      'IGNORING ALL ERRORS OF THIS KIND THIS RUN'
    )
    expect(result.current.ignoreErrorKindThisRun()).resolves.toBeUndefined()
  })
})
