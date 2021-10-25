import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertItem, AlertModal, Box, ModalPage, Text } from '@opentrons/components'
import { Portal } from '../../../App/portal'
import { useSteps, useLabwarePositionCheck } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'

import styles from '../styles.css'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}

const isComplete = true // TODO: replace this with isComplete boolean from useLabwarePositionCheck

export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const steps = useSteps()
  const [currentLabwareCheckStep, setCurrentLabwareCheckStep] = React.useState<
    number | null
  >(null)
  const { proceed, ctaText, isLoading, error } = useLabwarePositionCheck(
    () => null
  )

  return (
    <Portal level="top">
      {error != null && (
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
            <Text>there was an error processing your request on the robot</Text>
            <Text>Error: {error.message}</Text>
          </Box>
        </AlertModal>
      )}
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
        {isComplete ? (
          <SummaryScreen />
        ) : currentLabwareCheckStep !== null ? (
          <GenericStepScreen
            setCurrentLabwareCheckStep={setCurrentLabwareCheckStep}
            selectedStep={steps[currentLabwareCheckStep]}
            ctaText={ctaText}
            proceed={proceed}
          />
        ) : (
          <IntroScreen proceed={proceed} />
        )}
      </ModalPage>
    </Portal>
  )
}
