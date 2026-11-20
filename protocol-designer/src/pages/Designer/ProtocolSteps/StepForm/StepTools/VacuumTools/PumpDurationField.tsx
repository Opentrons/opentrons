import { useTranslation } from 'react-i18next'

import { Check, COLORS, StyledText } from '@opentrons/components'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import styles from './vacuumtools.module.css'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

export interface PumpDurationFieldProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function PumpDurationField(props: PumpDurationFieldProps): ReactNode {
  const { formData, propsForFields } = props
  const { t } = useTranslation('protocol_steps')
  return (
    <div className={styles.pump_duration_container}>
      <div className={styles.pump_duration_header}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('vacuum.controls.duration.title')}
        </StyledText>
        <button
          type="button"
          className={styles.pump_duration_check_button}
          onClick={() => {
            propsForFields.pumpDurationCheckbox.updateValue(
              formData.pumpDurationCheckbox !== true
            )
          }}
        >
          <Check
            color={COLORS.blue50}
            isChecked={formData.pumpDurationCheckbox === true}
          />
        </button>
      </div>
      {formData.pumpDurationCheckbox === true ? (
        <div className={styles.pump_duration_content}>
          <InputStepFormField
            showTooltip={false}
            padding="0"
            title={t('vacuum.controls.duration.label')}
            {...propsForFields.pumpDurationTime}
            units={t('application:units.time')}
          />
        </div>
      ) : null}
    </div>
  )
}
