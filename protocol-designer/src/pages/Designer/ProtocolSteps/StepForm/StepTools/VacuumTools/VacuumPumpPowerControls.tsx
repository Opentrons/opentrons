import { useTranslation } from 'react-i18next'

import { COLORS, Slider } from '@opentrons/components'

import { PumpDurationField } from './PumpDurationField'
import styles from './vacuumtools.module.css'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

export interface VacuumPumpPowerControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function VacuumPumpPowerControls(
  props: VacuumPumpPowerControlsProps
): JSX.Element {
  const { formData, propsForFields } = props
  const { t } = useTranslation('protocol_steps')
  return (
    <div className={styles.pump_controls_wrapper}>
      <div className={styles.pump_controls_list_item}>
        <Slider
          value={formData.percentPower ?? 1}
          label={t('vacuum.controls.mode.power')}
          adjustValue={propsForFields.percentPower.updateValue}
          backgroundColor={COLORS.grey35}
        />
        <PumpDurationField
          formData={formData}
          propsForFields={propsForFields}
        />
      </div>
    </div>
  )
}
