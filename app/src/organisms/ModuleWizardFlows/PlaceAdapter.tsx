import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import type { ModuleCalibrationWizardStepProps } from './types'

export const PlaceAdapter = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, goBack, attachedModule } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    // TODO: send calibration/moveToMaintenance command here for the pipette
    // that will be used in calibration
    proceed()
  }

  return (
    <GenericWizardTile
      header={t('place_adapter', { module: moduleName })}
      // TODO: swap this out with the right animation
      rightHandBody={<p>TODO: place adapter contents</p>}
      bodyText={t('place_flush')}
      proceedButtonText={t('confirm_placement')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
