import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

export const Results = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, flowType } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  //  TODO(jr, 10/26/22): change header to let when we plug in other flows
  //  and add error states
  const header = t('pip_cal_success')
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      break
    }
    //  TODO(jr, 10/26/22): wire up the other flows
  }

  return (
    <SimpleWizardBody
      iconColor={COLORS.successEnabled}
      header={header}
      //  TODO(jr, 10/26/22): wire up isSuccess when we add error states
      isSuccess={true}
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
