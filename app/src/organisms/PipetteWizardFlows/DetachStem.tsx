import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import removeProbe from '../../assets/images/change-pip/attach-stem.png'
import type { PipetteWizardStepProps } from './types'

export const DetachStem = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack } = props
  const { t } = useTranslation('pipette_wizard_flows')

  return (
    <GenericWizardTile
      header={t('remove_stem')}
      //  TODO(Jr, 10/26/22): replace image with correct one!
      rightHandBody={<img src={removeProbe} width="100%" alt="Remove stem" />}
      bodyText={<StyledText as="p">{t('remove_probe')}</StyledText>}
      proceedButtonText={t('complete_cal')}
      proceed={proceed}
      back={goBack}
    />
  )
}
