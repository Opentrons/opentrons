import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isDocumentedMutationError,
  useErrorRecoveryPolicy,
  useResumeRunFromRecoveryAssumingFalsePositiveMutation,
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { getErrorKind } from '/app/organisms/ErrorRecoveryFlows/utils'
import {
  useChainRunCommands,
  useUpdateRecoveryPolicyWithStrategy,
} from '/app/resources/runs'

import { ERROR_KINDS, RECOVERY_MAP } from '../../constants'
import {
  buildIgnorePolicyRules,
  buildPickUpTips,
  HOME_EXCEPT_PLUNGERS,
  HOME_PIPETTE_Z_AXES,
  isAssumeFalsePositiveResumeKind,
  RELEASE_GRIPPER_JAW,
  useRecoveryCommands,
} from '../useRecoveryCommands'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')
vi.mock('/app/organisms/ErrorRecoveryFlows/utils')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: vi.fn(
    () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
  ),
}))

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
  const mockStashedMapRef = { current: null as any }
  const mockRouteUpdateActions = {
    proceedToRouteAndStep: mockProceedToRouteAndStep,
    stashedMapRef: mockStashedMapRef,
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
    failedCommand: {
      byRunRecord: mockFailedCommand,
      byAnalysis: mockFailedCommand,
    },
    unvalidatedFailedCommand: mockFailedCommand,
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
    vi.mocked(isDocumentedMutationError).mockReturnValue(false)
    vi.mocked(useResumeRunFromRecoveryMutation).mockReturnValue({
      mutateAsync: mockResumeRunFromRecovery,
    } as any)
    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: mockChainRunCommands,
    } as any)
    vi.mocked(useUpdateRecoveryPolicyWithStrategy).mockReturnValue(
      mockUpdateErrorRecoveryPolicy as any
    )
    vi.mocked(
      useResumeRunFromRecoveryAssumingFalsePositiveMutation
    ).mockReturnValue({
      mutateAsync: mockResumeRunFromRecoveryAssumingFalsePositive,
    } as any)
    vi.mocked(useErrorRecoveryPolicy).mockReturnValue({} as any)
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
    mockStashedMapRef.current = {
      route: RECOVERY_MAP.RETRY_STEP.ROUTE,
      step: RECOVERY_MAP.RETRY_STEP.STEPS.CONFIRM_RETRY,
    }
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: vi.fn().mockRejectedValue(mockError),
    } as any)

    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await expect(result.current.homePipetteZAxes()).rejects.toThrow(
        'Could not execute command: Error: Mock error'
      )
    })

    expect(mockStashedMapRef.current).toBeNull()
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
    )
  })

  it('should rethrow DocumentedMutationError without routing to ERROR_WHILE_RECOVERING', async () => {
    const mockError = new Error('No documentation report provided')
    const mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockProceedToRouteAndStep.mockClear()
    vi.mocked(isDocumentedMutationError).mockReturnValue(true)
    vi.mocked(useChainRunCommands).mockReturnValue({
      chainRunCommands: vi.fn().mockRejectedValue(mockError),
    } as any)

    const { result } = renderHook(() =>
      useRecoveryCommands({
        ...props,
        routeUpdateActions: {
          ...mockRouteUpdateActions,
          handleMotionRouting: mockHandleMotionRouting,
        },
      })
    )

    await act(async () => {
      await expect(result.current.homePipetteZAxes()).rejects.toBe(mockError)
    })

    expect(mockHandleMotionRouting).toHaveBeenCalledWith(false)
    expect(mockProceedToRouteAndStep).not.toHaveBeenCalled()
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

  const IN_PLACE_COMMANDS = [
    'aspirateInPlace',
    'dispenseInPlace',
    'blowOutInPlace',
    'dropTipInPlace',
    'prepareToAspirate',
  ] as const

  const ERROR_SCENARIOS = [
    { type: 'overpressure', code: '3006' },
    { type: 'tipPhysicallyAttached', code: '3007' },
  ] as const

  it.each(
    ERROR_SCENARIOS.flatMap(error =>
      IN_PLACE_COMMANDS.map(commandType => ({
        errorType: error.type,
        errorCode: error.code,
        commandType,
      }))
    )
  )(
    'Should move to retryLocation if failed command is $commandType and error is $errorType when retrying',
    async ({ errorType, errorCode, commandType }) => {
      const { result } = renderHook(() => {
        const failedCommand = {
          ...mockFailedCommand,
          commandType,
          params: {
            pipetteId: 'mock-pipette-id',
          },
          error: {
            errorType,
            errorCode,
            isDefined: true,
            errorInfo: {
              retryLocation: [1, 2, 3],
            },
          },
        }
        return useRecoveryCommands({
          runId: mockRunId,
          failedCommand: {
            byRunRecord: failedCommand,
            byAnalysis: failedCommand,
          },
          unvalidatedFailedCommand: failedCommand,
          failedLabwareUtils: mockFailedLabwareUtils,
          routeUpdateActions: mockRouteUpdateActions,
          recoveryToastUtils: {} as any,
          analytics: {
            reportActionSelectedResult: mockReportActionSelectedResult,
            reportRecoveredRunResult: mockReportRecoveredRunResult,
          } as any,
          selectedRecoveryOption: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
        })
      })

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
            commandType,
            params: { pipetteId: 'mock-pipette-id' },
          },
        ],
        false
      )
    }
  )

  const LIQUID_TRACKING_COMMANDS = [
    'aspirateWhileTracking',
    'dispenseWhileTracking',
  ] as const

  it.each(LIQUID_TRACKING_COMMANDS)(
    'Should liquid probe before retrying if failed command is $commandType',
    async commandType => {
      const { result } = renderHook(() => {
        const failedCommand = {
          ...mockFailedCommand,
          commandType,
          params: {
            pipetteId: 'mock-pipette-id',
            volume: 50,
            flowRate: { x: 1, y: 1, z: 1 },
            trackFromLocation: {
              labwareId: 'labware-1',
              wellName: 'A1',
            },
            trackToLocation: {
              labwareId: 'labware-2',
              wellName: 'B1',
            },
          },
        }
        return useRecoveryCommands({
          runId: mockRunId,
          failedCommand: {
            byRunRecord: failedCommand,
            byAnalysis: failedCommand,
          },
          unvalidatedFailedCommand: failedCommand,
          failedLabwareUtils: mockFailedLabwareUtils,
          routeUpdateActions: mockRouteUpdateActions,
          recoveryToastUtils: {} as any,
          analytics: {
            reportActionSelectedResult: mockReportActionSelectedResult,
            reportRecoveredRunResult: mockReportRecoveredRunResult,
          } as any,
          selectedRecoveryOption: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
        })
      })

      await act(async () => {
        await result.current.retryFailedCommand()
      })

      expect(mockChainRunCommands).toHaveBeenLastCalledWith(
        [
          {
            commandType: 'liquidProbe',
            intent: 'fixit',
            params: {
              pipetteId: 'mock-pipette-id',
              volume: 50,
              flowRate: { x: 1, y: 1, z: 1 },
              trackFromLocation: {
                labwareId: 'labware-1',
                wellName: 'A1',
              },
              trackToLocation: {
                labwareId: 'labware-2',
                wellName: 'B1',
              },
              wellLocation: {
                origin: 'top',
                offset: {
                  x: 0,
                  y: 0,
                  z: 2,
                },
              },
            },
          },
          {
            commandType,
            params: {
              pipetteId: 'mock-pipette-id',
              volume: 50,
              flowRate: { x: 1, y: 1, z: 1 },
              trackFromLocation: {
                labwareId: 'labware-1',
                wellName: 'A1',
              },
              trackToLocation: {
                labwareId: 'labware-2',
                wellName: 'B1',
              },
            },
          },
        ],
        false
      )
    }
  )

  it('Should not liquid probe before retrying if failed command is not a liquid tracking command', async () => {
    const { result } = renderHook(() => {
      const failedCommand = {
        ...mockFailedCommand,
        commandType: 'aspirate' as const,
        params: {
          pipetteId: 'mock-pipette-id',
          volume: 50,
          flowRate: { x: 1, y: 1, z: 1 },
          labwareId: 'labware-1',
          wellName: 'A1',
          wellLocation: {
            origin: 'top',
            offset: { x: 0, y: 0, z: 0 },
          },
        },
      }
      return useRecoveryCommands({
        runId: mockRunId,
        failedCommand: {
          byRunRecord: failedCommand,
          byAnalysis: failedCommand,
        },
        unvalidatedFailedCommand: failedCommand,
        failedLabwareUtils: mockFailedLabwareUtils,
        routeUpdateActions: mockRouteUpdateActions,
        recoveryToastUtils: {} as any,
        analytics: {
          reportActionSelectedResult: mockReportActionSelectedResult,
          reportRecoveredRunResult: mockReportRecoveredRunResult,
        } as any,
        selectedRecoveryOption: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
      })
    })

    await act(async () => {
      await result.current.retryFailedCommand()
    })

    expect(mockChainRunCommands).toHaveBeenLastCalledWith(
      [
        {
          commandType: 'aspirate',
          params: {
            pipetteId: 'mock-pipette-id',
            volume: 50,
            flowRate: { x: 1, y: 1, z: 1 },
            labwareId: 'labware-1',
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 0, y: 0, z: 0 },
            },
          },
        },
      ],
      false
    )
  })

  it('should call resumeRun with runId and show success toast on success', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.resumeRun()
    })

    expect(mockResumeRunFromRecovery).toHaveBeenCalledWith(mockRunId)
    expect(mockMakeSuccessToast).toHaveBeenCalled()
  })

  it('should restore the previous screen when resumeRun documentation is cancelled', async () => {
    const mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockMakeSuccessToast.mockClear()
    vi.mocked(isDocumentedMutationError).mockReturnValue(true)
    mockResumeRunFromRecovery.mockRejectedValueOnce(
      new Error('No documentation report provided')
    )

    const { result } = renderHook(() =>
      useRecoveryCommands({
        ...props,
        routeUpdateActions: {
          ...mockRouteUpdateActions,
          handleMotionRouting: mockHandleMotionRouting,
        },
      })
    )

    await act(async () => {
      result.current.resumeRun()
    })

    expect(mockHandleMotionRouting).toHaveBeenCalledWith(false)
    expect(mockMakeSuccessToast).not.toHaveBeenCalled()
  })

  it('should call cancelRun with runId', () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    result.current.cancelRun()

    expect(mockStopRun).toHaveBeenCalledWith(
      mockRunId,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('should return to confirm cancel when cancelRun documentation is cancelled', async () => {
    mockStopRun.mockClear()
    mockProceedToRouteAndStep.mockClear()
    mockStashedMapRef.current = {
      route: RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
      step: RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING,
    }
    vi.mocked(isDocumentedMutationError).mockReturnValue(true)

    const { result } = renderHook(() => useRecoveryCommands(props))

    result.current.cancelRun()

    const onError = mockStopRun.mock.calls[0][1].onError as (
      error: unknown
    ) => void
    onError(new Error('No documentation report provided'))

    expect(mockStashedMapRef.current).toBeNull()
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.CANCEL_RUN.ROUTE,
      RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL
    )
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

    const mockRelevantPickUpTipLabware = {
      id: 'MOCK_LW_ID',
    } as any

    const buildPickUpTipsCmd = buildPickUpTips(
      mockFailedLabwareUtils.selectedTipLocations,
      mockFailedCmdWithPipetteId,
      mockRelevantPickUpTipLabware
    )

    const testProps = {
      ...props,
      unvalidatedFailedCommand: mockFailedCmdWithPipetteId,
      failedLabwareUtils: {
        ...mockFailedLabwareUtils,
        relevantPickUpTipLabware: mockRelevantPickUpTipLabware,
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
  it('should reject with error and call proceedToRouteAndStep when pickUpTips has invalid input', async () => {
    const testProps = {
      ...props,
      failedLabwareUtils: {
        ...mockFailedLabwareUtils,
        selectedTipLocations: null,
        relevantPickUpTipLabware: null,
      },
    }

    const { result } = renderHook(() => useRecoveryCommands(testProps))

    await act(async () => {
      await expect(result.current.pickUpTips()).rejects.toThrow(
        'Invalid use of pickUpTips command'
      )
    })

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
    )
    expect(mockReportActionSelectedResult).toHaveBeenCalledWith(
      RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
      'failed'
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

  it('should call flexStacker/perpareShuttle and resolve the promise', async () => {
    const mockFailedCommandWithError = {
      ...mockFailedCommand,
      commandType: 'unsafe/flexStacker/prepareShuttle',
      params: {
        moduleId: '123',
      },
      error: {
        errorType: 'mockErrorType',
      },
    }

    const testProps = {
      ...props,
      unvalidatedFailedCommand: mockFailedCommandWithError,
    }
    const { result } = renderHook(() => useRecoveryCommands(testProps))

    await act(async () => {
      await result.current.homeShuttle()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'unsafe/flexStacker/prepareShuttle',
          params: {
            moduleId: '123',
          },
          intent: 'fixit',
        },
      ],
      false
    )
  })

  it('should call flexStacker/perpareShuttle without moduleId', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.homeShuttle()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'unsafe/flexStacker/prepareShuttle',
          params: {
            moduleId: '',
          },
          intent: 'fixit',
        },
      ],
      false
    )
  })

  it('should call flexStacker/openLatch with moduleId', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.releaseLabwareLatch()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'unsafe/flexStacker/openLatch',
          params: {
            moduleId: '',
          },
          intent: 'fixit',
        },
      ],
      false
    )
  })

  it('should call flexStacker/closeLatch with moduleId', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.closeLabwareLatch()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'unsafe/flexStacker/closeLatch',
          params: {
            moduleId: '',
          },
          intent: 'fixit',
        },
      ],
      false
    )
  })

  it('should call useUpdatePositionEstimators and resolve the promise', async () => {
    const { result } = renderHook(() => useRecoveryCommands(props))

    await act(async () => {
      await result.current.homeExceptPlungers()
    })

    expect(mockChainRunCommands).toHaveBeenCalledWith(
      [HOME_EXCEPT_PLUNGERS],
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

  it('should restore the previous screen when skipFailedCommand documentation is cancelled', async () => {
    const mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockMakeSuccessToast.mockClear()
    vi.mocked(isDocumentedMutationError).mockReturnValue(true)
    mockResumeRunFromRecovery.mockRejectedValueOnce(
      new Error('No documentation report provided')
    )

    const { result } = renderHook(() =>
      useRecoveryCommands({
        ...props,
        routeUpdateActions: {
          ...mockRouteUpdateActions,
          handleMotionRouting: mockHandleMotionRouting,
        },
      })
    )

    await act(async () => {
      result.current.skipFailedCommand()
    })

    expect(mockHandleMotionRouting).toHaveBeenCalledWith(false)
    expect(mockMakeSuccessToast).not.toHaveBeenCalled()
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
      unvalidatedFailedCommand: mockFailedCommandWithError,
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
      expectedPolicyRules,
      'append'
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
      unvalidatedFailedCommand: mockFailedCommandWithError,
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
