import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { BODY_STYLE, SECTIONS } from './constants'
import type { PipetteWizardStepProps } from './types'
import { getPipetteAnimations } from './utils'

interface DetachProbeProps extends PipetteWizardStepProps {
  proceed: () => void
}

export const DetachProbe = (props: DetachProbeProps): JSX.Element => {
  const {
    isRobotMoving,
    goBack,
    proceed,
    mount,
    flowType,
    attachedPipettes,
  } = props
  const { t, i18n } = useTranslation('pipette_wizard_flows')
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.DETACH_PROBE }
  const channel = attachedPipettes[mount]?.data.channels

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={i18n.format(t('remove_cal_probe'), 'capitalize')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel,
      })}
      bodyText={
        <StyledText css={BODY_STYLE}>
          {i18n.format(t('remove_probe'), 'capitalize')}
        </StyledText>
      }
      proceedButtonText={t('complete_cal')}
      proceed={proceed}
      back={goBack}
    />
  )
}
