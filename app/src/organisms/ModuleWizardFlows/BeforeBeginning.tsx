import { Trans, useTranslation } from 'react-i18next'

import {
  HEATERSHAKER_MODULE_MODELS,
  TEMPERATURE_MODULE_MODELS,
  THERMOCYCLER_MODULE_MODELS,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import { LegacyStyledText } from '@opentrons/components'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { WizardRequiredEquipmentList } from '/app/molecules/WizardRequiredEquipmentList'

import type { AttachedModule } from '@opentrons/api-client'
import type { ModuleCalibrationWizardStepProps } from './types'

interface EqipmentItem {
  loadName: string
  displayName: string
  subtitle?: string
}

type BeforeBeginningProps = ModuleCalibrationWizardStepProps

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const { proceed, attachedModule } = props
  const { t } = useTranslation(['module_wizard_flows', 'shared'])

  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)

  let adapterLoadname: string
  let adapterDisplaynameKey: string
  const equipmentList = useAddEquipmentToSpecificModules([], attachedModule)
  if (
    THERMOCYCLER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    adapterLoadname = 'calibration_adapter_thermocycler'
    adapterDisplaynameKey = 'calibration_adapter_thermocycler'
  } else if (
    HEATERSHAKER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    adapterLoadname = 'calibration_adapter_heatershaker'
    adapterDisplaynameKey = 'calibration_adapter_heatershaker'
  } else if (
    TEMPERATURE_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    adapterLoadname = 'calibration_adapter_temperature'
    adapterDisplaynameKey = 'calibration_adapter_temperature'
  } else {
    adapterLoadname = ''
    console.error(
      `Invalid module type for calibration: ${attachedModule.moduleModel}`
    )
    return null
  }
  equipmentList.push(
    ...[
      { loadName: 'calibration_probe', displayName: t('pipette_probe') },
      { loadName: adapterLoadname, displayName: t(adapterDisplaynameKey) },
    ]
  )

  return (
    <GenericWizardTile
      header={t('calibration', { module: moduleDisplayName })}
      rightHandBody={
        <WizardRequiredEquipmentList equipmentList={equipmentList} />
      }
      bodyText={
        <Trans
          t={t}
          i18nKey={'branded:module_calibration_get_started'}
          values={{ module: moduleDisplayName }}
          components={{ block: <LegacyStyledText as="p" /> }}
        />
      }
      proceedButtonText={t('start_setup')}
      proceed={proceed}
    />
  )
}

const useAddEquipmentToSpecificModules = (
  equipmentList: EqipmentItem[],
  attachedModule: AttachedModule
): EqipmentItem[] => {
  const { t } = useTranslation('heater_shaker')
  if (
    HEATERSHAKER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    equipmentList.unshift({
      loadName: 't10_torx_screwdriver',
      displayName: t('t10_torx_screwdriver', {
        name: 'T10 Torx',
      }),
      subtitle: t('t10_torx_screwdriver_subtitle'),
    })
  }
  return equipmentList
}
