import * as React from 'react'
import { ALL, COLUMN } from '@opentrons/shared-data'
import { DropdownField, DropdownOption, FormGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import { StepFormDropdown } from './StepFormDropdownField'
import styles from '../StepEditForm.css'

export function Configure96ChannelField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'>
): JSX.Element {
  const {
    value: dropdownItem,
    name,
    onFieldBlur,
    onFieldFocus,
    updateValue,
  } = props

  const options: DropdownOption[] = [
    { name: 'All', value: ALL },
    { name: 'Column', value: COLUMN },
  ]

  const [selectedValue, setSelectedValue] = React.useState(
    dropdownItem || (options[0] && options[0].value)
  )
  React.useEffect(() => {
    updateValue(selectedValue)
  }, [selectedValue])

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.nozzles.label')}
      className={styles.small_field}
    >
      <DropdownField
        options={options}
        name={name}
        value={dropdownItem ? String(dropdownItem) : options[0].value}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          const newValue = e.currentTarget.value
          setSelectedValue(newValue)
          updateValue(newValue)
        }}
      />
    </FormGroup>
  )
}
