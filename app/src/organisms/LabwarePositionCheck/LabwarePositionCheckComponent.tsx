import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  Box,
  SPACING_2,
  Text,
  useConditionalConfirm,
} from '@opentrons/components'
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
import { useMostRecentCompletedAnalysis } from './hooks/useMostRecentCompletedAnalysis'
interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  caughtError?: Error
}

export const LabwarePositionCheckComponent = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const [
    savePositionCommandData,
    savePositionCommandDataDispatch,
  ] = React.useReducer(
    (
      state: { [labwareId: string]: string[] },
      action: { labwareId: string; commandId: string }
    ) => {
      const { labwareId, commandId } = action
      const nextCommandList =
        state[labwareId] != null
          ? // if there are already two command ids, overwrite the second one with the new one coming in
          // this is used when there is an unsuccessful pick up tip, and additional pick up tip attempts occur
          [state[labwareId][0], commandId]
          : [commandId]
      return {
        ...state,
        [labwareId]: nextCommandList,
      }
    },
    {}
  )
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(props.onCloseClick, true)

  // at the end of LPC, each labwareId will have 2 associated save position command ids which will be used to calculate the labware offsets
  const addSavePositionCommandData = (
    commandId: string,
    labwareId: string
  ): void => {
    savePositionCommandDataDispatch({ labwareId, commandId })
  }

  const protocolData = useMostRecentCompletedAnalysis(props.runId)
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const LPCSteps = useSteps(protocolData)

  const totalStepCount = LPCSteps.length
  const currentStep = LPCSteps?.[currentStepIndex]
  const proceed = (): void => setCurrentStepIndex(currentStepIndex !== LPCSteps.length - 1 ? currentStepIndex + 1 : currentStepIndex)

  if (protocolData == null || currentStep == null) return null
  console.log('CURRENT_STEP', currentStep)
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmation) {
    modalContent = (
      <ExitConfirmation
        onGoBack={cancelExitLPC}
        onConfirmExit={confirmExitLPC}
      />
    )
  } else if (currentStep.section === 'BEFORE_BEGINNING') {
    modalContent = <IntroScreen proceed={proceed} protocolData={protocolData} />
  } else if (currentStep.section === 'CHECK_TIP_RACKS') {
    modalContent = (
      <CheckItem
        runId={props.runId}
        {...currentStep}
        proceed={proceed}
        protocolData={protocolData} />
    )
  } else if (currentStep.section === 'PICK_UP_TIP') {
    modalContent = (<div> PICK_UP_TIP <button onClick={proceed}>PROCEED</button> </div>)
  } else if (currentStep.section === 'CHECK_LABWARE') {
    modalContent = (<div> CHECK_LABWARE <button onClick={proceed}>PROCEED</button> </div>)
  } else if (currentStep.section === 'RETURN_TIP') {
    modalContent = (<div> RETURN_TIP <button onClick={proceed}>PROCEED</button> </div>)
  } else if (currentStep.section === 'RESULTS_SUMMARY') {
    modalContent = (<div> RESULTS_SUMMARY <button onClick={proceed}>PROCEED</button> </div>)
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
