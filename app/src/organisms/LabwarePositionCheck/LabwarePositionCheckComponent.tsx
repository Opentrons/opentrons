import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import { Portal } from '../../App/portal'
import { useTrackEvent } from '../../redux/analytics'
import { useRestartRun } from '../ProtocolUpload/hooks'
import { useLabwarePositionCheck, useSteps } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'
import { RobotMotionLoadingModal } from './RobotMotionLoadingModal'
import { ConfirmPickUpTipModal } from './ConfirmPickUpTipModal'
import { ExitConfirmation } from './ExitConfirmation'
import { CheckItem } from './CheckItem'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { LoadingState } from '../CalibrationPanels/LoadingState'
import { useMostRecentCompletedAnalysis } from './hooks/useMostRecentCompletedAnalysis'
import { PickUpTip } from './PickUpTip'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import { LabwareOffsetCreateData, LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'
import { getLabwareDef } from './utils/labware'
import { CreateCommand, getLabwareDefURI } from '@opentrons/shared-data'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { CreateRunCommand } from './types'
interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  caughtError?: Error
}

export const LabwarePositionCheckInner = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { runId } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  console.log('RENDERED LPC COMPONENT')
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const [
    labwareOffsets,
    storeLabwareOffset,
  ] = React.useReducer(
    (
      state: LabwareOffsetCreateData[],
      action: { labwareId: string; location: LabwareOffsetLocation; vector: VectorOffset }
    ) => {
      const { labwareId, location, vector } = action
      if (protocolData == null) return state
      const labwareDef = getLabwareDef(labwareId, protocolData)
      if (labwareDef == null) {
        console.warn(`could not find corresponding labware definition for labwareId ${labwareId}`)
        return state
      }
      return [
        ...state,
        { definitionUri: getLabwareDefURI(labwareDef), location, vector },
      ]
    },
    []
  )
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(props.onCloseClick, true)
  const { createCommand, isLoading } = useCreateCommandMutation()
  const createRunCommand: CreateRunCommand = (variables, ...options) => {
    return createCommand({ ...variables, runId }, ...options)
  }

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const LPCSteps = useSteps(protocolData)
  const totalStepCount = LPCSteps.length
  const currentStep = LPCSteps?.[currentStepIndex]
  const proceed = (): void => setCurrentStepIndex(currentStepIndex !== LPCSteps.length - 1 ? currentStepIndex + 1 : currentStepIndex)
  if (protocolData == null || currentStep == null) return null

  const movementStepProps = { proceed, protocolData, createRunCommand }
  console.log('CURRENT_STEP', currentStep)
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmation) {
    modalContent = (
      <ExitConfirmation onGoBack={cancelExitLPC} onConfirmExit={confirmExitLPC} />
    )
  } else if (isLoading) {
    modalContent = <LoadingState />
  } else if (currentStep.section === 'BEFORE_BEGINNING') {
    modalContent = <IntroScreen proceed={proceed} protocolData={protocolData} />
  } else if (currentStep.section === 'CHECK_TIP_RACKS') {
    modalContent = (
      <CheckItem {...currentStep} {...movementStepProps} />
    )
  } else if (currentStep.section === 'PICK_UP_TIP') {
    modalContent = (
      <PickUpTip {...currentStep} {...movementStepProps} />
    )
  } else if (currentStep.section === 'CHECK_LABWARE') {
    modalContent = (
      <CheckItem {...currentStep} {...movementStepProps} />
    )
  } else if (currentStep.section === 'RETURN_TIP') {
    modalContent = (
      <ReturnTip {...currentStep} {...movementStepProps} />
    )
  } else if (currentStep.section === 'RESULTS_SUMMARY') {
    modalContent = (
      <ResultsSummary {...currentStep} protocolData={protocolData} />
    )
  }
  return (
    <Portal level="top">
      <ModalShell
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
    console.log('prev: ', prevRunId, ' next: ', nextRunId)
    return prevRunId === nextRunId
  }
)
