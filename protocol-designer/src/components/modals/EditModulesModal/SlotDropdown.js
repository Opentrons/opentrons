// @flow
import { DropdownField } from '@opentrons/components/src/forms/DropdownField'
import { useField } from 'formik'
import * as React from 'react'

type ModelDropdownProps = {|
  fieldName: string,
  disabled: boolean,
  tabIndex: number,
  options: Array<{|
    name: string,
    value: string,
    disabled?: boolean,
  |}>,
|}

export const SlotDropdown = (props: ModelDropdownProps): React.Node => {
  const { fieldName, options, disabled, tabIndex } = props
  const [field, meta] = useField(props.fieldName)
  return (
    <DropdownField
      tabIndex={tabIndex}
      options={options}
      name={fieldName}
      value={field.value}
      disabled={disabled}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.error}
    />
  )
}
