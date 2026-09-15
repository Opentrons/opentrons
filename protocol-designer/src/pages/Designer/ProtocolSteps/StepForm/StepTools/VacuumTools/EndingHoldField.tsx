import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import { VACUUM_PROGRAM_STATE } from '@opentrons/step-generation'

import { ToggleStepFormField } from '/protocol-designer/components/molecules'

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
    <div className={styles.ending_hold_field}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('vacuum.controls.ending_hold_vent.title')}
      </StyledText>
      <ToggleStepFormField
        title={t('vacuum.controls.ending_hold_vent.label')}
        isSelected={formData.endingHoldVentCheckbox === true}
        onLabel={t('vacuum.previous_state.vent.opened')}
        offLabel={t('vacuum.previous_state.vent.closed')}
        toggleUpdateValue={propsForFields.endingHoldVentCheckbox.updateValue}
        toggleValue={formData.endingHoldVentCheckbox}
        tooltipContent={null}
      />
    </div>
  )
}
