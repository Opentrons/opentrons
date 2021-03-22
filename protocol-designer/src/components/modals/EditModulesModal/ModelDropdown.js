// @flow
import * as React from 'react'
import { useField } from 'formik'
// TODO(bc, 2021-03-22): import should be from '@opentrons/components' make sure no circ deps
import { DropdownField } from '@opentrons/components/src/forms/DropdownField'

type ModelDropdownProps = {|
  fieldName: string,
  tabIndex: number,
  options: Array<{|
    name: string,
    value: string,
    disabled?: boolean,
  |}>,
|}
export const ModelDropdown = (props: ModelDropdownProps): React.Node => {
  const { fieldName, options, tabIndex } = props
  const [field, meta] = useField(fieldName)
  return (
    <DropdownField
      tabIndex={tabIndex}
      options={options}
      name={fieldName}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched && meta.error ? meta.error : null}
    />
  )
}
