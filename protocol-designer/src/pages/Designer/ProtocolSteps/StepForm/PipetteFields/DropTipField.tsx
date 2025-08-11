import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { RETURN_TIP } from '@opentrons/step-generation'

import { DropdownStepFormField } from '../../../../../components/molecules'
import { getEnableReturnTip } from '../../../../../feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '../../../../../step-forms/selectors'

import type { DropdownOption } from '@opentrons/components'
import type { FieldProps } from '../types'

export function DropTipField(props: FieldProps): JSX.Element {
  const { value: dropdownItem, updateValue } = props
  const { t, i18n } = useTranslation(['form', 'shared'])
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)

  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )
  const wasteChuteOption: DropdownOption = {
    name: t('shared:wasteChute'),
    value: wasteChute?.id ?? '',
  }
  const trashOption: DropdownOption = {
    name: t('shared:trashBin'),
    value: trashBin?.id ?? '',
  }

  const options: DropdownOption[] = []
  if (wasteChute != null) options.push(wasteChuteOption)
  if (trashBin != null) options.push(trashOption)

  const returnOption: DropdownOption = {
    name: t('form:step_edit_form.field.dropTip.option.return'),
    value: RETURN_TIP,
  }

  useEffect(() => {
    if (
      additionalEquipment[String(dropdownItem)] == null &&
      labwareEntities[String(dropdownItem)] == null &&
      dropdownItem !== RETURN_TIP
    ) {
      updateValue(null)
    }
  }, [dropdownItem])

  return (
    <DropdownStepFormField
      {...props}
      updateValue={updateValue}
      options={enableReturnTip ? [...options, returnOption] : options}
      value={dropdownItem ? String(dropdownItem) : null}
      title={i18n.format(
        t('step_edit_form.field.location.dropTip'),
        'capitalize'
      )}
      width="100%"
    />
  )
}
