import { useSelector } from 'react-redux'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SmallButton } from '../../atoms/buttons'
import {
  SUCCESSFULLY_ATTACHED,
  SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
  SUCCESSFULLY_CALIBRATED,
  SUCCESSFULLY_DETACHED,
} from './constants'
import type { GripperWizardStepProps, SuccessStep } from './types'

export const Success = (
  props: Pick<GripperWizardStepProps, 'proceed'> &
    Pick<GripperWizardStepProps, 'isRobotMoving'> &
    SuccessStep
): JSX.Element => {
  const { proceed, successfulAction, isRobotMoving } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)

  const infoByAction: {
    [action in SuccessStep['successfulAction']]: {
      header: string
      buttonText: string
    }
  } = {
    [SUCCESSFULLY_ATTACHED_AND_CALIBRATED]: {
      header: t('gripper_successfully_attached_and_calibrated'),
      buttonText: t('shared:exit'),
    },
    [SUCCESSFULLY_CALIBRATED]: {
      header: t('gripper_successfully_calibrated'),
      buttonText: t('shared:exit'),
    },
    [SUCCESSFULLY_ATTACHED]: {
      header: t('gripper_successfully_attached'),
      buttonText: t('calibrate_gripper'),
    },
    [SUCCESSFULLY_DETACHED]: {
      header: t('gripper_successfully_detached'),
      buttonText: t('shared:exit'),
    },
  }
  const { header, buttonText } = infoByAction[successfulAction]

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )

  return (
    <SimpleWizardBody
      iconColor={COLORS.successEnabled}
      header={header}
      isSuccess
    >
      {isOnDevice ? (
        <Flex justifyContent={JUSTIFY_FLEX_END} width="100%">
          <SmallButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            buttonText={buttonText}
            onClick={proceed}
          />
        </Flex>
      ) : (
        <PrimaryButton onClick={proceed}>{buttonText}</PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
