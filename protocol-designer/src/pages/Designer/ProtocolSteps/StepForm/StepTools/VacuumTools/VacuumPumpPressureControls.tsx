import { useTranslation } from 'react-i18next'

import {
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
} from '@opentrons/shared-data'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import { PumpDurationField } from './PumpDurationField'
import styles from './vacuumtools.module.css'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

export interface VacuumPumpPressureControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function VacuumPumpPressureControls(
  props: VacuumPumpPressureControlsProps
): JSX.Element {
  const { formData, propsForFields } = props
  const { t } = useTranslation('protocol_steps')
  return (
    <div className={styles.pump_controls_wrapper}>
      <div className={styles.pump_controls_list_item}>
        <InputStepFormField
          showTooltip={false}
          padding="0"
          title={t('vacuum.controls.mode.pressure.label')}
          {...propsForFields.pressureMbar}
          units={t('application:units.millibar')}
          caption={t('vacuum.controls.mode.pressure.caption', {
            min: VACUUM_MIN_PRESSURE_MBAR,
            max: VACUUM_MAX_PRESSURE_MBAR,
          })}
        />
        <PumpDurationField
          formData={formData}
          propsForFields={propsForFields}
        />
      </div>
    </div>
  )
}
