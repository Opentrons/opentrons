import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DropdownField, FormGroup } from '@opentrons/components'
import { getAllTiprackOptions } from '../../../../ui/labware/selectors'
import type { DropdownOption } from '@opentrons/components'
import type { StepFormDropdown } from '../StepFormDropdownField'

import styles from '../../StepEditForm.module.css'

export function PickUpTipField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {}
): JSX.Element {
  const {
    value: dropdownItem,
    name,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    disabled,
  } = props
  const { t } = useTranslation('form')
  const tiprackOptions = useSelector(getAllTiprackOptions)
  const defaultOption: DropdownOption = {
    name: 'Default - get next tip',
    value: '',
  }

  return (
    <FormGroup
      label={t('step_edit_form.field.location.pickUp')}
      className={styles.large_field}
      disabled={disabled}
    >
      <DropdownField
        disabled={disabled}
        options={[defaultOption, ...tiprackOptions]}
        name={name}
        value={dropdownItem ? String(dropdownItem) : null}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
}
