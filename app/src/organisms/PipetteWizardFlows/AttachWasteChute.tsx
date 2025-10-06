import { Trans, useTranslation } from 'react-i18next'

import {
  LegacyStyledText,
} from '@opentrons/components'
import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

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
    proceed,
    attachedPipettes,
    mount,
    goBack,
    flowType,
  } = props

  const { t, i18n } = useTranslation('pipette_wizard_flows')

  const pipetteWizardStep = {
    mount,
    flowType,
    section: SECTIONS.REMOVE_WASTE_CHUTE,
  }

  const is96Channel = attachedPipettes[mount]?.data.channels === 96
  const deckConfig = useNotifyDeckConfigurationQuery().data
  const isWasteChuteOnDeck =
    deckConfig?.some(fixture => fixture.cutoutId === WASTE_CHUTE_CUTOUT) ?? false

  const handleOnClick = (): void => {
    proceed()
  }

  if (isWasteChuteOnDeck && is96Channel) {
    return (
      <GenericWizardTile
        header={i18n.format(t('attach_wastechute'), 'capitalize')}
        rightHandBody={getPipetteAnimations({
          pipetteWizardStep,
          channel: attachedPipettes[mount]?.data.channels,
        })}
        bodyText={
          <LegacyStyledText css={BODY_STYLE}>
            <Trans
              t={t}
              i18nKey="install_waste_chute"
              components={{
                bold: <strong />,
              }}
            />
          </LegacyStyledText>
        }
        proceedButtonText={t('continue')}
        proceed={handleOnClick}
        back={flowType === FLOWS.ATTACH ? undefined : goBack}
      />
    )
  }

  return null
}
