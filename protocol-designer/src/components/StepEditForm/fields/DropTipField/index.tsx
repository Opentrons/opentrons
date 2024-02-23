import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DropdownField, DropdownOption, FormGroup } from '@opentrons/components'
import { getAdditionalEquipmentEntities } from '../../../../step-forms/selectors'
import { StepFormDropdown } from '../StepFormDropdownField'
import styles from '../../StepEditForm.css'

export function DropTipField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'>
): JSX.Element {
  const {
    value: dropdownItem,
    name,
    onFieldBlur,
    onFieldFocus,
    updateValue,
  } = props
  const { t } = useTranslation('form')
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )
  const wasteChuteOption: DropdownOption = {
    name: 'Waste Chute',
    value: wasteChute?.id ?? '',
  }
  const trashOption: DropdownOption = {
    name: 'Trash Bin',
    value: trashBin?.id ?? '',
  }

  const options: DropdownOption[] = []
  if (wasteChute != null) options.push(wasteChuteOption)
  if (trashBin != null) options.push(trashOption)

  React.useEffect(() => {
    if (additionalEquipment[String(dropdownItem)] == null) {
      updateValue(null)
    }
  }, [dropdownItem])
  return (
    <FormGroup
      label={t('step_edit_form.field.location.label')}
      className={styles.large_field}
    >
      <DropdownField
        options={options}
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
