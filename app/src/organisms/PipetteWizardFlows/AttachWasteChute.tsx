import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import type { ReactNode } from 'react'
import type { PipetteWizardStepProps } from './types'

export const AttachWasteChute = (props: PipetteWizardStepProps): ReactNode => {
  const {
    isRobotMoving,
    errorMessage,
    proceed,
    isOnDevice,
    isDoorOpenError,
    dismissDoorOpenError,
  } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleOnClick = (): void => {
    proceed()
  }

  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return errorMessage != null ? (
    isDoorOpenError ? (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_is_open')}
        subHeader={t('close_door_and_try_again')}
      >
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={Boolean(isOnDevice) ? ALIGN_CENTER : ALIGN_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          {Boolean(isOnDevice) ? (
            <SmallButton
              buttonText={t('try_again')}
              onClick={dismissDoorOpenError}
            />
          ) : (
            <PrimaryButton onClick={dismissDoorOpenError}>
              {t('try_again')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    ) : (
      <SimpleWizardBody
        iconColor={COLORS.red50}
        header={t('shared:error_encountered')}
        isSuccess={false}
        subHeader={errorMessage}
      />
    )
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
