import { useTranslation } from 'react-i18next'

import { Check, COLORS, StyledText } from '@opentrons/components'
import { VACUUM_PROGRAM_STATE } from '@opentrons/step-generation'

import styles from './vacuumtools.module.css'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

export interface EndingHoldFieldProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function EndingHoldField(
  props: EndingHoldFieldProps
): JSX.Element | null {
  const { formData, propsForFields } = props
  const { t } = useTranslation('protocol_steps')

  if (
    formData.programType === VACUUM_PROGRAM_STATE &&
    formData.pumpDurationCheckbox !== true
  ) {
    return null
  }

  return (
    <div className={styles.ending_hold_section}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('vacuum.controls.ending_hold_vent.title')}
      </StyledText>
      <button
        type="button"
        className={styles.ending_hold_row}
        onClick={() => {
          propsForFields.endingHoldVentCheckbox.updateValue(
            formData.endingHoldVentCheckbox !== true
          )
        }}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('vacuum.controls.ending_hold_vent.label')}
        </StyledText>
        <Check
          color={COLORS.blue50}
          isChecked={formData.endingHoldVentCheckbox === true}
        />
      </button>
    </div>
  )
}
