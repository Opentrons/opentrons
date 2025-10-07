import { Trans, useTranslation } from 'react-i18next'

import {
  Banner,
  COLORS,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE, SECTIONS } from './constants'
import { getPipetteAnimations } from './utils'

import type { PipetteWizardStepProps } from './types'

export const RemoveWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const {
    isRobotMoving,
    errorMessage,
    proceed,
    attachedPipettes,
    isOnDevice,
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

  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      isSuccess={false}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={t('remove_wastechute')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: attachedPipettes[mount]?.data.channels,
      })}
      bodyText={
        <>
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
          <Banner
            type="error"
            marginTop={
              Boolean(isOnDevice) ? SPACING.spacing24 : SPACING.spacing16
            }
          >
            {t('waste_chute_warning')}
          </Banner>
        </>
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
