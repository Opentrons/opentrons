import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { AlertPrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GRIPPER_FLOW_TYPES } from './constants'
import type { GripperWizardFlowType } from './types'

interface ExitConfirmationProps {
  handleExit: () => void
  handleGoBack: () => void
  flowType: GripperWizardFlowType
}

export function ExitConfirmation(props: ExitConfirmationProps): JSX.Element {
  const { handleGoBack, handleExit, flowType } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])

  const titleFlowType: { [flowType in GripperWizardFlowType]: string } = {
    [GRIPPER_FLOW_TYPES.ATTACH]: t('attach_gripper'),
    [GRIPPER_FLOW_TYPES.DETACH]: t('detach_gripper'),
    [GRIPPER_FLOW_TYPES.RECALIBRATE]: t('gripper_recalibration'),
  }
  const flowTitle: string = titleFlowType[flowType]

  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('progress_will_be_lost', { flow: flowTitle })}
      subHeader={t('are_you_sure_exit', { flow: flowTitle })}
      isSuccess={false}
    >
      <SecondaryButton onClick={handleGoBack} marginRight={SPACING.spacing2}>
        {t('shared:go_back')}
      </SecondaryButton>
      <AlertPrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        onClick={handleExit}
      >
        {t('shared:exit')}
      </AlertPrimaryButton>
    </SimpleWizardBody>
  )
}
