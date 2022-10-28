import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import attachProbe from '../../assets/images/change-pip/attach-stem.png'
import type { PipetteWizardStepProps } from './types'

export const AttachStem = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack } = props
  const { t } = useTranslation('pipette_wizard_flows')
  return (
    <GenericWizardTile
      header={t('attach_stem')}
      //  TODO(Jr, 10/26/22): replace image with correct one!
      rightHandBody={<img src={attachProbe} width="100%" alt="Attach stem" />}
      bodyText={<StyledText as="p">{t('install_probe')}</StyledText>}
      proceedButtonText={t('initiate_calibration')}
      proceed={proceed}
      back={goBack}
    />
  )
}
