import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'

import { EndingHoldField } from './EndingHoldField'
import { VacuumPumpPowerControls } from './VacuumPumpPowerControls'
import { VacuumPumpPressureControls } from './VacuumPumpPressureControls'
import styles from './vacuumtools.module.css'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

export interface VacuumPumpControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function VacuumPumpControls(
  props: VacuumPumpControlsProps
): JSX.Element | null {
  const { formData, propsForFields } = props
  const { t } = useTranslation('protocol_steps')
  if (
    formData.modeType !== VACUUM_MODE_POWER &&
    formData.modeType !== VACUUM_MODE_PRESSURE
  ) {
    return null
  }

  const controlsComponent =
    formData.modeType === VACUUM_MODE_POWER ? (
      <VacuumPumpPowerControls
        formData={formData}
        propsForFields={propsForFields}
      />
    ) : (
      <VacuumPumpPressureControls
        formData={formData}
        propsForFields={propsForFields}
      />
    )

  return (
    <div className={styles.pump_controls_root}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('vacuum.controls.vacuum_pump_settings')}
      </StyledText>
      {controlsComponent}
      <EndingHoldField formData={formData} propsForFields={propsForFields} />
    </div>
  )
}
