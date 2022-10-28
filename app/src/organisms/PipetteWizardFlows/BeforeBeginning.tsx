import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import { CALIBRATION_PROBE, FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

const BEFORE_YOU_BEGIN_URL = '' //  TODO(jr, 10/26/22): link real URL!

export const BeforeBeginning = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, flowType } = props
  const { t } = useTranslation('pipette_wizard_flows')
  //  TODO(jr, 10/26/22): when we wire up other flows, const will turn into let
  //  for proceedButtonText and rightHandBody
  const proceedButtonText: string = t('get_started')
  const rightHandBody = (
    <WizardRequiredEquipmentList
      width="100%"
      equipmentList={[CALIBRATION_PROBE]}
    />
  )
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      break
    }
    //  TODO(jr, 10/26/22): wire up the other flows
  }
  return (
    <GenericWizardTile
      header={t('before_you_begin')}
      getHelp={BEFORE_YOU_BEGIN_URL}
      rightHandBody={rightHandBody}
      bodyText={
        <Trans
          t={t}
          i18nKey="remove_labware_to_get_started"
          components={{ block: <StyledText as="p" /> }}
        />
      }
      proceedButtonText={proceedButtonText}
      proceed={proceed}
    />
  )
}
