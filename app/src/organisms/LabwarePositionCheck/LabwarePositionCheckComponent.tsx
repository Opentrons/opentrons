import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import { Portal } from '../../App/portal'
// import { useTrackEvent } from '../../redux/analytics'
import { useSteps } from './hooks'
import { IntroScreen } from './IntroScreen'
import { ExitConfirmation } from './ExitConfirmation'
import { CheckItem } from './CheckItem'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { PickUpTip } from './PickUpTip'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import { useCreateCommandMutation, useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'

import type { LabwareOffset } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '../../molecules/DeprecatedJogControls/types'
import type { CreateRunCommand, RegisterPositionAction, WorkingOffset } from './types'
import type { Coordinates } from '@opentrons/shared-data'
import { LabwareOffsetCreateData } from '@opentrons/api-client'

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
    { workingOffsets, tipPickUpPosition },
    registerPosition,
  ] = React.useReducer(
    (
      state: { workingOffsets: WorkingOffset[], tipPickUpPosition: Coordinates | null },
      action: RegisterPositionAction
    ) => {
      const { type, labwareId, location, position } = action
      console.log('ACTION', tipPickUpPosition)
      if (type === 'tipPickUpPosition') return { ...state, tipPickUpPosition: position }

      if (['initialPosition', 'finalPosition'].includes(type)) {
        const existingRecordIndex = state.workingOffsets.findIndex(record => (
          record.labwareId === labwareId && isEqual(record.location, location)
        ))
        if (existingRecordIndex >= 0) {
          if (type === 'initialPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                { ...state.workingOffsets[existingRecordIndex], initialPosition: position, finalPosition: null },
                ...state.workingOffsets.slice(existingRecordIndex + 1)
              ]
            }
          } else if (type === 'finalPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                { ...state.workingOffsets[existingRecordIndex], finalPosition: position },
                ...state.workingOffsets.slice(existingRecordIndex + 1)
              ]
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
              initialPosition: type === 'initialPosition' ? position : null,
              finalPosition: type === 'finalPosition' ? position : null,
            },
          ]
        }
      } else {
        return state
      }
    },
    { workingOffsets: [], tipPickUpPosition: null }
  )
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(props.onCloseClick, true)
  const { createCommand, isLoading: isRobotMoving } = useCreateCommandMutation()
  const { createCommand: createSilentCommand } = useCreateCommandMutation()
  const createRunCommand: CreateRunCommand = (variables, ...options) => {
    return createCommand({ ...variables, runId }, ...options)
  }
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const LPCSteps = useSteps(protocolData)
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]
  const proceed = (): void => setCurrentStepIndex(currentStepIndex !== LPCSteps.length - 1 ? currentStepIndex + 1 : currentStepIndex)
  if (protocolData == null || currentStep == null) return null

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
          params: { pipetteId: pipetteId, distance: step * dir, axis, },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT,
      })
        .then(data => { onSuccess != null && onSuccess(data?.data?.result?.position ?? null) })
        .catch((e: Error) => { console.error(`error issuing jog command: ${e.message}`) })
    } else {
      console.error(`could not find pipette to jog with id: ${pipetteId}`)
    }
  }
  const movementStepProps = { proceed, protocolData, createRunCommand, registerPosition, handleJog, isRobotMoving }

  const handleApplyOffsets = (offsets: LabwareOffsetCreateData[]): void => {
    Promise.all(
      offsets.map(data => createLabwareOffset({ runId: runId, data }))
    ).then(() => {
      onCloseClick()
    }).catch((e: Error) => {
      console.error(`error applying labware offsets: ${e.message}`)
    })

  }

  console.log('CURRENT_STEP', currentStep)

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmation) {
    modalContent = (
      <ExitConfirmation onGoBack={cancelExitLPC} onConfirmExit={confirmExitLPC} />
    )
  } else if (currentStep.section === 'BEFORE_BEGINNING') {
    modalContent = <IntroScreen {...movementStepProps} />
  } else if (currentStep.section === 'CHECK_TIP_RACKS') {
    modalContent = (
      <CheckItem {...currentStep} {...movementStepProps} {...{ workingOffsets, existingOffsets }} />
    )
  } else if (currentStep.section === 'PICK_UP_TIP') {
    modalContent = (
      <PickUpTip {...currentStep} {...movementStepProps} {...{ workingOffsets, existingOffsets, tipPickUpPosition }} />
    )
  } else if (currentStep.section === 'CHECK_LABWARE') {
    modalContent = (
      <CheckItem {...currentStep} {...movementStepProps} {...{ workingOffsets, existingOffsets }} />
    )
  } else if (currentStep.section === 'RETURN_TIP') {
    modalContent = (
      <ReturnTip {...currentStep} {...movementStepProps} {...{ workingOffsets, tipPickUpPosition }} />
    )
  } else if (currentStep.section === 'RESULTS_SUMMARY') {
    modalContent = (
      <ResultsSummary {...currentStep} protocolData={protocolData} {...{ workingOffsets, existingOffsets, handleApplyOffsets }} />
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
            onExit={confirmExitLPC}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}

export const LabwarePositionCheckComponent = React.memo(
  LabwarePositionCheckInner,
  ({ runId: prevRunId }, { runId: nextRunId }) => {
    return prevRunId === nextRunId
  }
)
