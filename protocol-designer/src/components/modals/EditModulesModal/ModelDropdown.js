// @flow
import React from 'react'
import { FormGroup } from '../../../../../components/src/forms/FormGroup'
import type { ModuleRealType } from '@opentrons/shared-data'
import styles from './EditModules.css'
import { DropdownField } from '../../../../../components/src/forms/DropdownField'
import { MODELS_FOR_MODULE_TYPE } from '../../../constants'
import { useField } from 'formik'
import { useResetSlotOnModelChange } from './form-state'
type ModelDropdownProps = {
  moduleType: ModuleRealType,
  selectedModel: ?string,
}
export const ModelDropdown = (props: ModelDropdownProps) => {
  const { moduleType, selectedModel } = props
  const [field, meta] = useField('selectedModel')
  useResetSlotOnModelChange()

  return (
    <FormGroup label="Model*" className={styles.option_model}>
      <DropdownField
        tabIndex={0}
        options={MODELS_FOR_MODULE_TYPE[moduleType]}
        name="selectedModel"
        value={selectedModel}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={meta.error}
      />
    </FormGroup>
  )
}
