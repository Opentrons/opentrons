import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DropdownField, FormGroup } from '@opentrons/components'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '../../../../step-forms/selectors'
import { getAllTiprackOptions } from '../../../../ui/labware/selectors'
import { getEnableReturnTip } from '../../../../feature-flags/selectors'
import type { DropdownOption } from '@opentrons/components'
import type { StepFormDropdown } from '../StepFormDropdownField'

import styles from '../../StepEditForm.module.css'

export function DropTipField(
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
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const tiprackOptions = useSelector(getAllTiprackOptions)
  const enableReturnTip = useSelector(getEnableReturnTip)

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
    if (
      additionalEquipment[String(dropdownItem)] == null &&
      labwareEntities[String(dropdownItem)] == null
    ) {
      updateValue(null)
    }
  }, [dropdownItem])

  return (
    <FormGroup
      label={
        enableReturnTip
          ? t('step_edit_form.field.location.dropTip')
          : t('step_edit_form.field.location.label')
      }
      className={styles.large_field}
      disabled={disabled}
    >
      <DropdownField
        disabled={disabled}
        options={enableReturnTip ? [...options, ...tiprackOptions] : options}
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
