import * as React from 'react'
import { useSelector } from 'react-redux'
import { DropdownField, DropdownOption, FormGroup } from '@opentrons/components'
import { FLEX_TRASH_DEF_URI, OT_2_TRASH_DEF_URI } from '../../../../constants'
import { i18n } from '../../../../localization'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '../../../../step-forms/selectors'
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
  const labware = useSelector(getLabwareEntities)
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const trash = Object.values(labware).find(
    lw =>
      lw.labwareDefURI === FLEX_TRASH_DEF_URI ||
      lw.labwareDefURI === OT_2_TRASH_DEF_URI
  )
  const wasteChuteOption: DropdownOption = {
    name: 'Waste Chute',
    value: wasteChute?.id ?? '',
  }
  const trashOption: DropdownOption = {
    name: 'Trash Bin',
    value: trash?.id ?? '',
  }

  const options: DropdownOption[] = []
  if (wasteChute != null) options.push(wasteChuteOption)
  if (trash != null) options.push(trashOption)

  const [selectedValue, setSelectedValue] = React.useState(
    dropdownItem || (options[0] && options[0].value)
  )
  React.useEffect(() => {
    updateValue(selectedValue)
  }, [selectedValue])

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.location.label')}
      className={styles.large_field}
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
