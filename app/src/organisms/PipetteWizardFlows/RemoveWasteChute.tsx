import { useState } from 'react'
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

import { startCalibrationOnClick } from './utils'

import type { PipetteWizardStepProps } from './types'

export const RemoveWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const {
    attachedPipettes,
    mount,
    isOnDevice,
    isRobotMoving,
    errorMessage,
    isDoorOpenError,
    dismissDoorOpenError,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [, setShowUnableToDetect] = useState<boolean>(false)
  const pipetteId = attachedPipettes[mount]?.serialNumber
  if (pipetteId == null) return null

  const startCalibration = startCalibrationOnClick(
    props,
    setShowUnableToDetect,
    pipetteId,
    t('door_is_open') as string
  )
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
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        header={t('shared:error_encountered')}
        isSuccess={false}
        subHeader={errorMessage}
      />
    )
  ) : (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      header={t('waste_chute_error')}
      subHeader={t('waste_chute_warning')}
      iconColor={COLORS.yellow50}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          buttonType="primary"
          onClick={startCalibration}
          buttonText={t('begin_calibration')}
        />
      ) : (
        <PrimaryButton onClick={startCalibration}>
          {t('begin_calibration')}
        </PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
