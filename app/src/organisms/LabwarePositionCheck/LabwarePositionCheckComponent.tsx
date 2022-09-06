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
import { useLabwarePositionCheck } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'
import { RobotMotionLoadingModal } from './RobotMotionLoadingModal'
import { ConfirmPickUpTipModal } from './ConfirmPickUpTipModal'
import { ExitPreventionModal } from './ExitPreventionModal'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  caughtError?: Error
}

export const LabwarePositionCheckComponent = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const restartRun = useRestartRun()
  const trackEvent = useTrackEvent()
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
  const [isRestartingRun, setIsRestartingRun] = React.useState<boolean>(false)
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
  const labwarePositionCheckUtils = useLabwarePositionCheck(
    addSavePositionCommandData,
    savePositionCommandData
  )

  if ('error' in labwarePositionCheckUtils) {
    // show the modal for 5 seconds, then unmount and restart the run
    if (!isRestartingRun) {
      setTimeout(() => restartRun(), 5000)
      setIsRestartingRun(true)
      const { name, message } = labwarePositionCheckUtils.error
      trackEvent({
        name: 'labwarePositionCheckFailed',
        properties: { error: { message, name } },
      })
    }
    const { error } = labwarePositionCheckUtils
    return (
      <Portal level="top">
        <AlertModal
          heading={t('error_modal_header')}
          iconName={null}
          buttons={[
            {
              children: t('shared:close'),
              onClick: props.onCloseClick,
            },
          ]}
          alertOverlay
        >
          <Box>
            <Text marginTop={SPACING_2}>Error: {error.message}</Text>
          </Box>
        </AlertModal>
      </Portal>
    )
  }

  const {
    beginLPC,
    proceed,
    ctaText,
    currentCommandIndex,
    currentStep,
    showPickUpTipConfirmationModal,
    onUnsuccessfulPickUpTip,
    isComplete,
    titleText,
    isLoading,
    jog,
  } = labwarePositionCheckUtils

  let modalContent: JSX.Element
  if (isLoading) {
    modalContent = <RobotMotionLoadingModal title={titleText} />
  } else if (showConfirmation) {
    modalContent = (
      <ExitPreventionModal
        onGoBack={cancelExitLPC}
        onConfirmExit={confirmExitLPC}
      />
    )
  } else if (showPickUpTipConfirmationModal) {
    modalContent = (
      <ConfirmPickUpTipModal
        confirmText={ctaText}
        onConfirm={proceed}
        onDeny={onUnsuccessfulPickUpTip}
      />
    )
  } else if (isComplete) {
    modalContent = (
      <SummaryScreen
        savePositionCommandData={savePositionCommandData}
        onCloseClick={props.onCloseClick}
      />
    )
  } else if (currentCommandIndex !== 0) {
    modalContent = (
      <GenericStepScreen
        selectedStep={currentStep}
        ctaText={ctaText}
        proceed={proceed}
        title={titleText}
        jog={jog}
        runId={props.runId}
        savePositionCommandData={savePositionCommandData}
      />
    )
  } else {
    modalContent = <IntroScreen beginLPC={beginLPC} />
  }
  return (
    <Portal level="top">
      <ModalShell
        header={
          <WizardHeader
            title={t('labware_position_check_title')}
            currentStep={1}
            totalSteps={5}
            onExit={confirmExitLPC}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}
