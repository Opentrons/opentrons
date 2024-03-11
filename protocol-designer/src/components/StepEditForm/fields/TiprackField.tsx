import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup, DropdownField } from '@opentrons/components'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import styles from '../StepEditForm.module.css'

import type { FieldProps } from '../types'

export const TiprackField = (props: FieldProps): JSX.Element => {
  const { t } = useTranslation('form')
  const options = useSelector(uiLabwareSelectors.getTiprackOptions)

  return (
    <FormGroup
      label={t('step_edit_form.tipRack')}
      className={styles.large_field}
    >
      <DropdownField
        options={options}
        name={props.name}
        value={String(props.value) != null ? String(props.value) : null}
        onBlur={props.onFieldBlur}
        onFocus={props.onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          props.updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
}
