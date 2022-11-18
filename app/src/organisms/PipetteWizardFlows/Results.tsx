import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

export const Results = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, flowType, attachedPipette, mount } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  let header: string = 'unknown results screen'
  let iconColor: string = COLORS.successEnabled
  let isSuccess: boolean = true

  switch (flowType) {
    case FLOWS.CALIBRATE: {
      header = t('pip_cal_success')
      break
    }
    case FLOWS.ATTACH: {
      if (attachedPipette[mount] != null) {
        const pipetteName = attachedPipette[mount]?.modelSpecs.displayName
        header = t('pipette_attached', { pipetteName: pipetteName })
      } else {
        header = t('pipette_failed_to_attach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      }
    }
    //  TODO(jr, 10/26/22): wire up the other flows
  }

  return (
    <SimpleWizardBody
      iconColor={iconColor}
      header={header}
      isSuccess={isSuccess}
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
