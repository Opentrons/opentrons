import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPage } from '@opentrons/components'
import { Portal } from '../../../App/portal'
import { useSteps } from './hooks'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'
import { SummaryScreen } from './SummaryScreen'
import { RobotMotionLoadingModal } from './RobotMotionLoadingModal'

import styles from '../styles.css'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}

const isComplete = true // TODO: replace this with isComplete boolean from useLabwarePositionCheck

export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const isLoading: boolean = true
  const steps = useSteps()
  const [currentLabwareCheckStep, setCurrentLabwareCheckStep] = React.useState<
    number | null
  >(null)

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
        ) : currentLabwareCheckStep !== null ? (
          <GenericStepScreen
            setCurrentLabwareCheckStep={setCurrentLabwareCheckStep}
            selectedStep={steps[currentLabwareCheckStep]}
          />
        ) : (
          <IntroScreen
            setCurrentLabwareCheckStep={setCurrentLabwareCheckStep}
          />
        )}
      </ModalPage>
    </Portal>
  )
}
