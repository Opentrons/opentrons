import { Trans, useTranslation } from 'react-i18next'

import {
  LegacyStyledText,
  COLORS,
  SPACING
} from '@opentrons/components'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import { getPipetteAnimations } from './utils'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

interface RemoveWasteChuteProps extends PipetteWizardStepProps {
  deckConfig: DeckConfiguration
}

export const RemoveWasteChute = (
  props: RemoveWasteChuteProps
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
    section: SECTIONS.REMOVE_WASTE_CHUTE,
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
      header={i18n.format(t('remove_wastechute'), 'capitalize')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: attachedPipettes[mount]?.data.channels,
      })}
      bodyText={
        <Trans
          t={t}
          i18nKey="waste_chute_error"
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
