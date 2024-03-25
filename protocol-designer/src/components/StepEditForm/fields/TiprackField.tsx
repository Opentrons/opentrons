import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup, DropdownField } from '@opentrons/components'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import styles from '../StepEditForm.module.css'

import type { FieldProps } from '../types'

export function TiprackField(props: FieldProps): JSX.Element {
  const { name, value, onFieldBlur, onFieldFocus, updateValue } = props
  const { t } = useTranslation('form')
  const options = useSelector(uiLabwareSelectors.getTiprackOptions)

  return (
    <FormGroup
      label={t('step_edit_form.tipRack')}
      className={styles.large_field}
    >
      <DropdownField
        options={options}
        name={name}
        value={String(value) != null ? String(value) : null}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
}
