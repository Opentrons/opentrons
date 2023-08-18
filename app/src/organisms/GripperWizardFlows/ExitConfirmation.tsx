import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  COLORS,
  SPACING,
  AlertPrimaryButton,
  SecondaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SmallButton } from '../../atoms/buttons'
import { GRIPPER_FLOW_TYPES } from './constants'
import type { GripperWizardFlowType } from './types'

interface ExitConfirmationProps {
  handleExit: () => void
  handleGoBack: () => void
  flowType: GripperWizardFlowType
  isRobotMoving: boolean
}

export function ExitConfirmation(props: ExitConfirmationProps): JSX.Element {
  const { handleGoBack, handleExit, flowType, isRobotMoving } = props
  const { i18n, t } = useTranslation(['gripper_wizard_flows', 'shared'])

  const titleFlowType: { [flowType in GripperWizardFlowType]: string } = {
    [GRIPPER_FLOW_TYPES.ATTACH]: t('attach_gripper'),
    [GRIPPER_FLOW_TYPES.DETACH]: t('detach_gripper'),
    [GRIPPER_FLOW_TYPES.RECALIBRATE]: t('gripper_recalibration'),
  }
  const flowTitle: string = titleFlowType[flowType]
  const isOnDevice = useSelector(getIsOnDevice)

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )

  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('progress_will_be_lost', { flow: flowTitle })}
      subHeader={t('are_you_sure_exit', { flow: flowTitle })}
      isSuccess={false}
    >
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing4}
        >
          <SmallButton
            buttonType="alert"
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
            onClick={handleExit}
            marginRight={SPACING.spacing4}
          />
          <SmallButton
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
        </Flex>
      ) : (
        <>
          <SecondaryButton
            onClick={handleGoBack}
            marginRight={SPACING.spacing4}
          >
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton onClick={handleExit}>
            {i18n.format(t('shared:exit'), 'capitalize')}
          </AlertPrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
