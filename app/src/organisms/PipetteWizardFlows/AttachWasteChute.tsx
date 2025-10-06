import { Trans, useTranslation } from 'react-i18next'

import { COLORS, LegacyStyledText, SPACING } from '@opentrons/components'
import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import { getPipetteAnimations } from './utils'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

interface AttachWasteChuteProps extends PipetteWizardStepProps {
  deckConfig: DeckConfiguration
}

export const AttachWasteChute = (
  props: AttachWasteChuteProps
): JSX.Element | null => {
  const {
    isRobotMoving,
    errorMessage,
    proceed,
    attachedPipettes,
    mount,
    goBack,
    flowType,
  } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const pipetteWizardStep = {
    mount,
    flowType,
    section: SECTIONS.ATTACH_WASTE_CHUTE,
  }

  const handleOnClick = (): void => {
    proceed()
  }
  if (isRobotMoving)
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  return errorMessage != null ? (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      isSuccess={false}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={i18n.format(t('attach_wastechute'), 'capitalize')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: attachedPipettes[mount]?.data.channels,
      })}
      bodyText={
        <Trans
          t={t}
          i18nKey="install_waste_chute"
          components={{
            block: (
              <LegacyStyledText
                css={BODY_STYLE}
                marginBottom={SPACING.spacing16}
              />
            ),
          }}
        />
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed = {flowType === FLOWS.ATTACH ? proceed: handleOnClick}
      back={goBack}
    />
  )
}
