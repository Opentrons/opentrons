import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import { Portal } from '../../App/portal'
// import { useTrackEvent } from '../../redux/analytics'
import { IntroScreen } from './IntroScreen'
import { ExitConfirmation } from './ExitConfirmation'
import { CheckItem } from './CheckItem'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { PickUpTip } from './PickUpTip'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import {
  useCreateCommandMutation,
  useCreateLabwareOffsetMutation,
} from '@opentrons/react-api-client'

import type { LabwareOffset } from '@opentrons/api-client'
import {
  CompletedProtocolAnalysis,
  Coordinates,
  FIXED_TRASH_ID,
} from '@opentrons/shared-data'
import type {
  Axis,
  Sign,
  StepSize,
} from '../../molecules/DeprecatedJogControls/types'
import type {
  CreateRunCommand,
  RegisterPositionAction,
  WorkingOffset,
} from './types'
import { LabwareOffsetCreateData } from '@opentrons/api-client'
import { getLabwarePositionCheckSteps } from './getLabwarePositionCheckSteps'
import { chainRunCommands } from './utils/chainRunCommands'
import { DropTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds
interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  existingOffsets: LabwareOffset[]
  caughtError?: Error
}

export const LabwarePositionCheckInner = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { runId, mostRecentAnalysis, onCloseClick, existingOffsets } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const protocolData = mostRecentAnalysis
  const [
    { workingOffsets, tipPickUpOffset },
    registerPosition,
  ] = React.useReducer(
    (
      state: {
        workingOffsets: WorkingOffset[]
        tipPickUpOffset: Coordinates | null
      },
      action: RegisterPositionAction
    ) => {
      if (action.type === 'tipPickUpOffset') {
        return { ...state, tipPickUpOffset: action.offset }
      }

      if (
        action.type === 'initialPosition' ||
        action.type === 'finalPosition'
      ) {
        const { labwareId, location, position } = action
        const existingRecordIndex = state.workingOffsets.findIndex(
          record =>
            record.labwareId === labwareId && isEqual(record.location, location)
        )
        if (existingRecordIndex >= 0) {
          if (action.type === 'initialPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                {
                  ...state.workingOffsets[existingRecordIndex],
                  initialPosition: position,
                  finalPosition: null,
                },
                ...state.workingOffsets.slice(existingRecordIndex + 1),
              ],
            }
          } else if (action.type === 'finalPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                {
                  ...state.workingOffsets[existingRecordIndex],
                  finalPosition: position,
                },
                ...state.workingOffsets.slice(existingRecordIndex + 1),
              ],
            }
          }
        }
        return {
          ...state,
          workingOffsets: [
            ...state.workingOffsets,
            {
              labwareId,
              location,
              initialPosition:
                action.type === 'initialPosition' ? position : null,
              finalPosition: action.type === 'finalPosition' ? position : null,
            },
          ],
        }
      } else {
        return state
      }
    },
    { workingOffsets: [], tipPickUpOffset: null }
  )
  const {
    createCommand,
    isLoading: isCommandMutationLoading,
  } = useCreateCommandMutation()
  const { createCommand: createSilentCommand } = useCreateCommandMutation()
  const createRunCommand: CreateRunCommand = (variables, ...options) => {
    return createCommand({ ...variables, runId }, ...options)
  }
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const [isRobotMoving, setIsRobotMoving] = React.useState<boolean>(false)
  React.useEffect(() => {
    if (isCommandMutationLoading) {
      const timer = setTimeout(() => setIsRobotMoving(true), 700)
      return () => clearTimeout(timer)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading])

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const handleCleanUpAndClose = (): void => {
    const dropTipToBeSafeCommands: DropTipCreateCommand[] = (
      protocolData?.pipettes ?? []
    ).map(pip => ({
      commandType: 'dropTip' as const,
      params: {
        pipetteId: pip.id,
        labwareId: FIXED_TRASH_ID,
        wellName: 'A1',
        wellLocation: { origin: 'top' as const },
      },
    }))
    chainRunCommands(
      [
        ...dropTipToBeSafeCommands,
        { commandType: 'home' as const, params: {} },
      ],
      createRunCommand,
      props.onCloseClick
    )
  }
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      setCurrentStepIndex(
        currentStepIndex !== LPCSteps.length - 1
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  if (protocolData == null) return null
  const LPCSteps = getLabwarePositionCheckSteps(protocolData)
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]
  if (currentStep == null) return null

  const handleJog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
    onSuccess?: (position: Coordinates | null) => void
  ): void => {
    const pipetteId = 'pipetteId' in currentStep ? currentStep.pipetteId : null
    if (pipetteId != null) {
      createSilentCommand({
        runId,
        command: {
          commandType: 'moveRelative',
          params: { pipetteId: pipetteId, distance: step * dir, axis },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT,
      })
        .then(data => {
          onSuccess != null && onSuccess(data?.data?.result?.position ?? null)
        })
        .catch((e: Error) => {
          console.error(`error issuing jog command: ${e.message}`)
        })
    } else {
      console.error(`could not find pipette to jog with id: ${pipetteId}`)
    }
  }
  const movementStepProps = {
    proceed,
    protocolData,
    createRunCommand,
    registerPosition,
    handleJog,
    isRobotMoving,
    workingOffsets,
    existingOffsets,
  }

  const handleApplyOffsets = (offsets: LabwareOffsetCreateData[]): void => {
    Promise.all(
      offsets.map(data => createLabwareOffset({ runId: runId, data }))
    )
      .then(() => {
        onCloseClick()
      })
      .catch((e: Error) => {
        console.error(`error applying labware offsets: ${e.message}`)
      })
  }

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmation) {
    modalContent = (
      <ExitConfirmation
        onGoBack={cancelExitLPC}
        onConfirmExit={confirmExitLPC}
      />
    )
  } else if (currentStep.section === 'BEFORE_BEGINNING') {
    modalContent = <IntroScreen {...movementStepProps} />
  } else if (
    currentStep.section === 'CHECK_TIP_RACKS' ||
    currentStep.section === 'CHECK_LABWARE'
  ) {
    modalContent = <CheckItem {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'PICK_UP_TIP') {
    modalContent = <PickUpTip {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'RETURN_TIP') {
    modalContent = (
      <ReturnTip
        {...currentStep}
        {...movementStepProps}
        {...{ tipPickUpOffset }}
      />
    )
  } else if (currentStep.section === 'RESULTS_SUMMARY') {
    modalContent = (
      <ResultsSummary
        {...currentStep}
        protocolData={protocolData}
        {...{ workingOffsets, existingOffsets, handleApplyOffsets }}
      />
    )
  }
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={t('labware_position_check_title')}
            currentStep={currentStepIndex}
            totalSteps={totalStepCount}
            onExit={showConfirmation ? null : confirmExitLPC}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}

// NOTE: we are memoizing on the run id here, because this flow cannot be launched 
// until the robot analysis loads (which requires a stable run), other components that
// rendered nearby will cause the run to be periodically polled for updates 
// and we don't need those polls causing unnecessary rerenders to the LPC flow 
export const LabwarePositionCheckComponent = React.memo(
  LabwarePositionCheckInner,
  ({ runId: prevRunId }, { runId: nextRunId }) => prevRunId === nextRunId
)
