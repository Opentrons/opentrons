import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GRIPPER_FLOW_TYPES } from './constants'
import type { GripperWizardFlowType, GripperWizardStepProps } from './types'

export const Results = (props: GripperWizardStepProps): JSX.Element => {
  const { proceed, flowType } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  const headerByFlowType: {[flowType in GripperWizardFlowType]: string} = {
    [GRIPPER_FLOW_TYPES.RECALIBRATE]: t('gripper_successfully_calibrated'),
    [GRIPPER_FLOW_TYPES.ATTACH]: t('gripper_successfully_attached'),
    [GRIPPER_FLOW_TYPES.DETACH]: t('gripper_successfully_detached')
  }

  return (
    <SimpleWizardBody
      iconColor={COLORS.successEnabled}
      header={headerByFlowType[flowType] ?? 'unknown flow'}
      isSuccess
    >
      <PrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        onClick={proceed}
        aria-label="Results_exit"
      >
        {t('shared:exit')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
