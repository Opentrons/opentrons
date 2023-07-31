import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import pipetteProbe1 from 'app/src/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import type { ModuleCalibrationWizardStepProps } from './types'

export const AttachProbe = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, goBack } = props
  const { t } = useTranslation('pipette_wizard_flows')

  const handleOnClick = (): void => {
    // TODO: send calibration/calibrateModule command here
    proceed()
  }

  // TODO: add calibration loading screen and error screen
  return (
    <GenericWizardTile
      header={t('attach_probe')}
      // TODO: make sure this is the right animation
      rightHandBody={pipetteProbe1}
      bodyText={t('calibtaion_probe')}
      proceedButtonText={t('begin_calibration')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
