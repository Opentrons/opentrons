import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import { Trans, useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import type {
  CreateMaintenanceRunData,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { AxiosError } from 'axios'
import type { ModuleCalibrationWizardStepProps } from './types'

interface BeforeBeginningProps extends ModuleCalibrationWizardStepProps {
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
}

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    createMaintenanceRun,
    isCreateLoading,
    attachedModule,
  } = props
  const { t } = useTranslation(['module_wizard_flows', 'shared'])
  React.useEffect(() => {
    createMaintenanceRun({})
  }, [])
  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)
  // TODO: get the image for calibration adapter
  const equipmentList = [
    { loadName: 'calibration_probe', displayName: t('pipette_probe') },
    { loadName: 'calibration_adapter', displayName: t('cal_adapter') },
  ]

  return (
    <GenericWizardTile
      header={t('calibration', { module: moduleDisplayName })}
      rightHandBody={
        <WizardRequiredEquipmentList equipmentList={equipmentList} />
      }
      bodyText={
        <Trans
          t={t}
          i18nKey={'get_started'}
          values={{ module: moduleDisplayName }}
          components={{ block: <StyledText as="p" /> }}
        />
      }
      proceedButtonText={t('move_gantry_to_front')}
      proceedIsDisabled={isCreateLoading}
      proceed={proceed}
    />
  )
}
