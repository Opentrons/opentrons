import { Trans, useTranslation } from 'react-i18next'

import {
  Banner,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE } from './constants'

import type { PipetteWizardStepProps } from './types'

export const RemoveWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element => {
  const { isRobotMoving, errorMessage, proceed, isOnDevice, goBack } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

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
      rightHandBody={''}
      bodyText={
        <>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing6}>
            <Trans
              t={t}
              i18nKey="waste_chute_error"
              components={{
                block: <LegacyStyledText css={BODY_STYLE} />,
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
          </Flex>
        </>
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
