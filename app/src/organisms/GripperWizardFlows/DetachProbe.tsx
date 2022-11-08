import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { GripperWizardStepProps } from './types'

interface DetachProbeProps extends GripperWizardStepProps {
  handleCleanUp: () => void
}

export const DetachProbe = (props: DetachProbeProps): JSX.Element => {
  const { isRobotMoving, goBack, handleCleanUp } = props
  const { t } = useTranslation('gripper_wizard_flows')

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={t('remove_cal_probe')}
      rightHandBody={<StyledText>TODO gripper remove probe image</StyledText>}
      bodyText={<StyledText as="p">{t('remove_probe')}</StyledText>}
      proceedButtonText={t('complete_cal')}
      proceed={handleCleanUp}
      back={goBack}
    />
  )
}
