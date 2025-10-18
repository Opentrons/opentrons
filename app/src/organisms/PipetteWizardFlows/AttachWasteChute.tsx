import { useTranslation } from 'react-i18next'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import type { PipetteWizardStepProps } from './types'

export const AttachWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element => {
  const { isRobotMoving, errorMessage, proceed, isOnDevice } = props

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
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      header={t('attach_wastechute')}
      subHeader={t('waste_chute_attach_warning')}
      iconColor={COLORS.yellow50}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          buttonType="primary"
          onClick={handleOnClick}
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        />
      ) : (
        <PrimaryButton onClick={handleOnClick}>
          {t('shared:confirm')}
        </PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
