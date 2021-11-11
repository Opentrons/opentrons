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
import { useSteps, useLabwarePositionCheck } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'
import { RobotMotionLoadingModal } from './RobotMotionLoadingModal'

import styles from '../styles.css'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}

export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const [savePositionCommandData, setSavePositionCommandData] = React.useState<{
    [labwareId: string]: string[]
  }>({})

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
    addSavePositionCommandData
  )

  if ('error' in labwarePositionCheckUtils) {
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
    isComplete
  } = labwarePositionCheckUtils

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
        {isLoading ? (
          <RobotMotionLoadingModal title={'Moving to Slot 7'} />
        ) : null}
        {isComplete ? (
          <SummaryScreen />
        ) : currentCommandIndex !== 0 ? (
          <GenericStepScreen
            selectedStep={currentStep}
            ctaText={ctaText}
            proceed={proceed}
          />
        ) : (
          <IntroScreen beginLPC={beginLPC} />
        )}
      </ModalPage>
    </Portal>
  )
}
