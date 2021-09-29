import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPage } from '@opentrons/components'
import { Portal } from '../../../App/portal'

import styles from '../styles.css'
import { IntroScreen } from './IntroScreen'
import { GenericStepScreen } from './GenericStepScreen'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}

export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const [
    currentLabwareCheckStep,
    setCurrentLabwareCheckStep,
  ] = React.useState<Number | null>(null)
  // placeholder for next steps
  console.log(currentLabwareCheckStep)

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
        {currentLabwareCheckStep !== null ? (
          <GenericStepScreen selectedStep={{} as any} /> // replace this with actual selected step
        ) : (
          <IntroScreen
            setCurrentLabwareCheckStep={setCurrentLabwareCheckStep}
          />
        )}
      </ModalPage>
    </Portal>
  )
}
