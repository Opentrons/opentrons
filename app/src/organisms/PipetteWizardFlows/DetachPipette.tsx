import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import detachPipette from '../../assets/images/change-pip/single-channel-detach-pipette.png'
import type { PipetteWizardStepProps } from './types'

export const DetachPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { isRobotMoving, goBack, proceed } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={t('loose_detach')}
      //  TODO(Jr, 11/8/22): replace image with correct one!
      rightHandBody={
        <img src={detachPipette} width="100%" alt="Detach pipette" />
      }
      bodyText={<StyledText as="p">{t('hold_and_loosen')}</StyledText>}
      proceedButtonText={capitalize(t('shared:continue'))}
      proceed={proceed}
      back={goBack}
    />
  )
}
