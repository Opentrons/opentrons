// @flow
import * as React from 'react'

import { SelectField } from '@opentrons/components'
import { FormTableRow } from './FormTableRow'
import { UploadKeyInput } from './UploadKeyInput'
import { LABEL_ADD_NEW_KEY } from './constants'

import type { SelectFieldProps } from '@opentrons/components'
import type { WifiKey } from './types'

export type SelectKeyProps = {|
  id: $NonMaybeType<$PropertyType<SelectFieldProps, 'id'>>,
  name: $NonMaybeType<$PropertyType<SelectFieldProps, 'name'>>,
  placeholder: $PropertyType<SelectFieldProps, 'placeholder'>,
  value: $PropertyType<SelectFieldProps, 'value'>,
  error: $PropertyType<SelectFieldProps, 'error'>,
  onValueChange: $NonMaybeType<
    $PropertyType<SelectFieldProps, 'onValueChange'>
  >,
  onLoseFocus: $PropertyType<SelectFieldProps, 'onLoseFocus'>,
  robotName: string,
  label: string,
  wifiKeys: Array<WifiKey>,
  className?: string,
|}

export const ADD_NEW_KEY_VALUE = '__addNewKey__'

const ADD_NEW_KEY_OPTION_GROUP = {
  options: [{ value: ADD_NEW_KEY_VALUE, label: LABEL_ADD_NEW_KEY }],
}

const makeKeyOptions = (keys: Array<WifiKey>) => ({
  options: keys.map(k => ({ value: k.id, label: k.name })),
})

export const SelectKey = (props: SelectKeyProps) => {
  const { robotName, label, wifiKeys, onValueChange, ...fieldProps } = props
  const options = [makeKeyOptions(wifiKeys), ADD_NEW_KEY_OPTION_GROUP]
  const uploadKeyRef = React.useRef()

  const handleValueChange = (name, value) => {
    if (value === ADD_NEW_KEY_VALUE) {
      uploadKeyRef.current && uploadKeyRef.current.click()
    } else {
      onValueChange(name, value)
    }
  }

  const handleKeyUpload = keyId => {
    onValueChange(fieldProps.name, keyId)
  }

  return (
    <>
      <FormTableRow label={label} labelFor={fieldProps.id}>
        <SelectField
          {...fieldProps}
          onValueChange={handleValueChange}
          options={options}
        />
      </FormTableRow>
      <UploadKeyInput
        ref={uploadKeyRef}
        label={LABEL_ADD_NEW_KEY}
        robotName={robotName}
        onUpload={handleKeyUpload}
      />
    </>
  )
}
