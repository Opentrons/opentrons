import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  Box,
  ModalPage,
  SPACING_2,
  Text,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'
import { useRestartRun } from '../../ProtocolUpload/hooks/useRestartRun'
import { useLabwarePositionCheck } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'
import { RobotMotionLoadingModal } from './RobotMotionLoadingModal'
import { ConfirmPickUpTipModal } from './ConfirmPickUpTipModal'

import styles from '../styles.css'
import type { SavePositionCommandData } from './types'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}
export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const restartRun = useRestartRun()
  const [
    savePositionCommandData,
    setSavePositionCommandData,
  ] = React.useState<SavePositionCommandData>({})
  const [isRestartingRun, setIsRestartingRun] = React.useState<boolean>(false)

  // at the end of LPC, each labwareId will have 2 associated save position command ids which will be used to calculate the labware offsets
  const addSavePositionCommandData = (
    commandId: string,
    labwareId: string
  ): void => {
    setSavePositionCommandData({
      ...savePositionCommandData,
      [labwareId]:
        savePositionCommandData[labwareId] != null
          ? [...savePositionCommandData[labwareId], commandId]
          : [commandId],
    })
  }
  const labwarePositionCheckUtils = useLabwarePositionCheck(
    addSavePositionCommandData,
    savePositionCommandData
  )

  if ('error' in labwarePositionCheckUtils) {
    // show the modal for 5 seconds, then unmount and restart the run
    if (!isRestartingRun) {
      setTimeout(() => restartRun(), 5000)
      !isRestartingRun && setIsRestartingRun(true)
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
            <Text>{t('error_modal_text')}</Text>
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

  let LPCInnerComponent: React.ReactNode = null
  if (isLoading) {
    LPCInnerComponent = <RobotMotionLoadingModal title={titleText} />
  } else if (showPickUpTipConfirmationModal) {
    LPCInnerComponent = (
      <ConfirmPickUpTipModal
        title={t('confirm_pick_up_tip_modal_title')}
        denyText={t('confirm_pick_up_tip_modal_try_again_text')}
        confirmText={ctaText}
        onConfirm={proceed}
        onDeny={onUnsuccessfulPickUpTip}
      />
    )
  } else if (isComplete) {
    LPCInnerComponent = (
      <SummaryScreen savePositionCommandData={savePositionCommandData} />
    )
  } else if (currentCommandIndex !== 0) {
    LPCInnerComponent = (
      <GenericStepScreen
        selectedStep={currentStep}
        ctaText={ctaText}
        proceed={proceed}
        title={titleText}
        jog={jog}
      />
    )
  } else {
    LPCInnerComponent = <IntroScreen beginLPC={beginLPC} />
  }

  return (
    <Portal level="top">
      <ModalPage
        contentsClassName={styles.modal_contents}
        titleBar={{
          title: t('labware_position_check_title'),
          back: {
            onClick: props.onCloseClick,
            title: t('shared:exit'),
            children: t('shared:exit'),
          },
        }}
      >
        {LPCInnerComponent}
      </ModalPage>
    </Portal>
  )
}
