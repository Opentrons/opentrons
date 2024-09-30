import { useTranslation } from 'react-i18next'
import { LegacyStyledText } from '@opentrons/components'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'
import { BODY_STYLE, SECTIONS } from './constants'
import { getPipetteAnimations } from './utils'
import type { PipetteWizardStepProps } from './types'

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
    errorMessage,
  } = props
  const { t, i18n } = useTranslation('pipette_wizard_flows')
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.DETACH_PROBE }
  const channel = attachedPipettes[mount]?.data.channels

  if (isRobotMoving)
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={i18n.format(t('remove_cal_probe'), 'capitalize')}
      //  todo(jr, 5/30/23): update animations! these are not final for 1, 8 and 96
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel,
      })}
      bodyText={
        <LegacyStyledText css={BODY_STYLE}>
          {i18n.format(t('remove_probe'), 'capitalize')}
        </LegacyStyledText>
      }
      proceedButtonText={
        errorMessage != null ? t('exit_cal') : t('complete_cal')
      }
      proceed={proceed}
      back={errorMessage != null ? undefined : goBack}
    />
  )
}
