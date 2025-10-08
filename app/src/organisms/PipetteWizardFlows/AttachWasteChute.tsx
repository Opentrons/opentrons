import { Trans, useTranslation } from 'react-i18next'

import {
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

export const AttachWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element => {
  const {
    isRobotMoving,
    errorMessage,
    proceed,
    mount,
    goBack,
    flowType,
  } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

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
      header={t('attach_wastechute')}
      rightHandBody={''}
      bodyText={
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing6}>
          <Trans
            t={t}
            i18nKey="install_waste_chute"
            components={{
              block: <LegacyStyledText css={BODY_STYLE} />,
            }}
          />
        </Flex>
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
