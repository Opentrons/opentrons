import { vi, it, describe, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
  useUpdateErrorRecoveryPolicy,
  useResumeRunFromRecoveryAssumingFalsePositiveMutation,
} from '@opentrons/react-api-client'

import { useChainRunCommands } from '/app/resources/runs'
import {
  useRecoveryCommands,
  HOME_PIPETTE_Z_AXES,
  RELEASE_GRIPPER_JAW,
  buildPickUpTips,
  buildIgnorePolicyRules,
  isAssumeFalsePositiveResumeKind,
  UPDATE_ESTIMATORS_EXCEPT_PLUNGERS,
  HOME_GRIPPER_Z,
} from '../useRecoveryCommands'
import { RECOVERY_MAP, ERROR_KINDS } from '../../constants'
import { getErrorKind } from '/app/organisms/ErrorRecoveryFlows/utils'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')
vi.mock('/app/organisms/ErrorRecoveryFlows/utils')

describe('useRecoveryCommands', () => {
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
  const mockMakeSuccessToast = vi.fn()
  const mockResumeRunFromRecovery = vi.fn(() =>
    Promise.resolve(mockMakeSuccessToast())
  )
  const mockResumeRunFromRecoveryAssumingFalsePositive = vi.fn(() =>
    Promise.resolve(mockMakeSuccessToast())
  )
  const mockStopRun = vi.fn()
  const mockChainRunCommands = vi.fn().mockResolvedValue([])
  const mockReportActionSelectedResult = vi.fn()
  const mockReportRecoveredRunResult = vi.fn()
  const mockUpdateErrorRecoveryPolicy = vi.fn(() => Promise.resolve())

  const props = {
    runId: mockRunId,
    failedCommandByRunRecord: mockFailedCommand,
    failedLabwareUtils: mockFailedLabwareUtils,
    routeUpdateActions: mockRouteUpdateActions,
    recoveryToastUtils: { makeSuccessToast: mockMakeSuccessToast } as any,
    analytics: {
      reportActionSelectedResult: mockReportActionSelectedResult,
      reportRecoveredRunResult: mockReportRecoveredRunResult,
    } as any,
    selectedRecoveryOption: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
  }

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
    vi.mocked(useUpdateErrorRecoveryPolicy).mockReturnValue({
      mutateAsync: mockUpdateErrorRecoveryPolicy,
    } as any)
    vi.mocked(
      useResumeRunFromRecoveryAssumingFalsePositiveMutation
    ).mockReturnValue({
      mutateAsync: mockResumeRunFromRecoveryAssumingFalsePositive,
    } as any)
  })

  it('should call chainRunRecoveryCommands with continuePastCommandFailure set to false', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.homePipetteZAxes()
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

    const { result } = renderHook(() => useRecoveryCommands(props))

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

    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.retryFailedCommand()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [expectedNewCommand],
      false
    )
  })
  ;([
    'aspirateInPlace',
    'dispenseInPlace',
    'blowOutInPlace',
    'dropTipInPlace',
    'prepareToAspirate',
  ] as const).forEach(inPlaceCommandType => {
    it(`Should move to retryLocation if failed command is ${inPlaceCommandType} and error is appropriate when retrying`, async () => {
      const { result } = renderHook(() =>
        useRecoveryCommands({
          runId: mockRunId,
          failedCommandByRunRecord: {
            ...mockFailedCommand,
            commandType: inPlaceCommandType,
            params: {
              pipetteId: 'mock-pipette-id',
            },
            error: {
              errorType: 'overpressure',
              errorCode: '3006',
              isDefined: true,
              errorInfo: {
                retryLocation: [1, 2, 3],
              },
            },
          },
          failedLabwareUtils: mockFailedLabwareUtils,
          routeUpdateActions: mockRouteUpdateActions,
          recoveryToastUtils: {} as any,
          analytics: {
            reportActionSelectedResult: mockReportActionSelectedResult,
            reportRecoveredRunResult: mockReportRecoveredRunResult,
          } as any,
          selectedRecoveryOption: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
        })
      )
      await act(async () => {
        await result.current.retryFailedCommand()
      })
      expect(mockChainRunCommands).toHaveBeenLastCalledWith(
        [
          {
            commandType: 'moveToCoordinates',
            intent: 'fixit',
            params: {
              pipetteId: 'mock-pipette-id',
              coordinates: { x: 1, y: 2, z: 3 },
            },
          },
          {
            commandType: inPlaceCommandType,
            params: { pipetteId: 'mock-pipette-id' },
          },
        ],
        false
      )
    })
  })

  it('should call resumeRun with runId and show success toast on success', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.resumeRun()
    })

    expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
    expect(mockMakeSuccessToast).toHaveBeenCalled()
  })

  it('should call cancelRun with runId', () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    result.current.cancelRun()

    expect(mockStopRun).toHaveBeenCalledWith(mockRunId)
  })

  it('should call homePipetteZAxes with the appropriate command', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

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

    const testProps = {
      ...props,
      failedCommandByRunRecord: mockFailedCmdWithPipetteId,
      failedLabwareUtils: {
        ...mockFailedLabwareUtils,
        failedLabware: mockFailedLabware,
      },
    }

    const { result } = renderHook(() => useRecoveryCommands(testProps))

    await act(async () => {
      await result.current.pickUpTips()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [buildPickUpTipsCmd],
      false
    )
  })

  it('should call releaseGripperJaws and resolve the promise', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.releaseGripperJaws()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [RELEASE_GRIPPER_JAW],
      false
    )
  })

  it('should call useUpdatePositionEstimators and resolve the promise', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.updatePositionEstimatorsAndHomeGripper()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [UPDATE_ESTIMATORS_EXCEPT_PLUNGERS, HOME_GRIPPER_Z],
      false
    )
  })

  it('should call skipFailedCommand and show success toast on success', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.skipFailedCommand()
    })

    expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
    expect(mockMakeSuccessToast).toHaveBeenCalled()
  })

  it('should call updateErrorRecoveryPolicy with correct policy rules when failedCommand has an error', async () => {
    const mockFailedCommandWithError = {
      ...mockFailedCommand,
      commandType: 'aspirateInPlace',
      error: {
        errorType: 'mockErrorType',
      },
    }

    const testProps = {
      ...props,
      failedCommandByRunRecord: mockFailedCommandWithError,
    }

    const { result, rerender } = renderHook(() =>
      useRecoveryCommands(testProps)
    )

    await act(async () => {
      await result.current.ignoreErrorKindThisRun(true)
    })

    rerender()

    result.current.skipFailedCommand()

    const expectedPolicyRules = buildIgnorePolicyRules(
      'aspirateInPlace',
      'mockErrorType',
      'ignoreAndContinue'
    )

    expect(mockUpdateErrorRecoveryPolicy).toHaveBeenCalledWith(
      expectedPolicyRules
    )
  })

  it('should call proceedToRouteAndStep with ERROR_WHILE_RECOVERING route when updateErrorRecoveryPolicy rejects', async () => {
    const mockFailedCommandWithError = {
      ...mockFailedCommand,
      commandType: 'aspirateInPlace',
      error: {
        errorType: 'mockErrorType',
      },
    }

    const testProps = {
      ...props,
      failedCommandByRunRecord: mockFailedCommandWithError,
    }

    mockUpdateErrorRecoveryPolicy.mockRejectedValueOnce(
      new Error('Update policy failed')
    )

    const { result } = renderHook(() => useRecoveryCommands(testProps))

    await act(async () => {
      await result.current.ignoreErrorKindThisRun(true)
    })

    expect(mockUpdateErrorRecoveryPolicy).toHaveBeenCalled()
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
    )
  })

  describe('skipFailedCommand with false positive handling', () => {
    it('should call resumeRunFromRecoveryAssumingFalsePositive for tip-related errors', async () => {
      vi.mocked(getErrorKind).mockReturnValue(ERROR_KINDS.TIP_NOT_DETECTED)

      const { result } = renderHook(() => useRecoveryCommands(props))

      await act(async () => {
        await result.current.skipFailedCommand()
      })

      expect(
        mockResumeRunFromRecoveryAssumingFalsePositive
      ).toHaveBeenCalledWith(mockRunId)
      expect(mockMakeSuccessToast).toHaveBeenCalled()
    })

    it('should call regular resumeRunFromRecovery for non-tip-related errors', async () => {
      vi.mocked(getErrorKind).mockReturnValue(ERROR_KINDS.GRIPPER_ERROR)

      const { result } = renderHook(() => useRecoveryCommands(props))

      await act(async () => {
        await result.current.skipFailedCommand()
      })

      expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
      expect(mockMakeSuccessToast).toHaveBeenCalled()
    })
  })
})

describe('isAssumeFalsePositiveResumeKind', () => {
  it(`should return true for ${ERROR_KINDS.TIP_NOT_DETECTED} error kind`, () => {
    vi.mocked(getErrorKind).mockReturnValue(ERROR_KINDS.TIP_NOT_DETECTED)

    expect(isAssumeFalsePositiveResumeKind({} as any)).toBe(true)
  })

  it(`should return true for ${ERROR_KINDS.TIP_DROP_FAILED} error kind`, () => {
    vi.mocked(getErrorKind).mockReturnValue(ERROR_KINDS.TIP_DROP_FAILED)

    expect(isAssumeFalsePositiveResumeKind({} as any)).toBe(true)
  })

  it('should return false for other error kinds', () => {
    vi.mocked(getErrorKind).mockReturnValue(ERROR_KINDS.GRIPPER_ERROR)

    expect(isAssumeFalsePositiveResumeKind({} as any)).toBe(false)
  })
})
