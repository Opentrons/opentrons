// @flow
import * as React from 'react'

import { SelectField } from '@opentrons/components'
import { FormRow } from './FormRow'
import { UploadKeyInput } from './UploadKeyInput'
import { LABEL_ADD_NEW_KEY } from '../i18n'
import { useConnectFormField } from './form-state'

import type { WifiKey } from '../types'

export type KeyFileFieldProps = {|
  id: string,
  name: string,
  label: string,
  placeholder: string,
  robotName: string,
  wifiKeys: Array<WifiKey>,
  className?: string,
|}

const ADD_NEW_KEY_VALUE = '__addNewKey__'

const ADD_NEW_KEY_OPTION_GROUP = {
  options: [{ value: ADD_NEW_KEY_VALUE, label: LABEL_ADD_NEW_KEY }],
}

const makeKeyOptions = (keys: Array<WifiKey>) => ({
  options: keys.map(k => ({ value: k.id, label: k.name })),
})

export const KeyFileField = (props: KeyFileFieldProps) => {
  const { id, name, label, placeholder, robotName, wifiKeys } = props
  const { value, error, setValue, setTouched } = useConnectFormField(name)
  const options = [makeKeyOptions(wifiKeys), ADD_NEW_KEY_OPTION_GROUP]
  const uploadKeyRef = React.useRef()

  const handleValueChange = (_, value) => {
    if (value === ADD_NEW_KEY_VALUE) {
      uploadKeyRef.current && uploadKeyRef.current.click()
    } else {
      setValue(value)
    }
  }

  return (
    <>
      <FormRow label={label} labelFor={id}>
        <SelectField
          {...{
            id,
            name,
            placeholder,
            value,
            error,
            options,
            onValueChange: handleValueChange,
            onLoseFocus: () => setTouched(true),
          }}
        />
      </FormRow>
      <UploadKeyInput
        ref={uploadKeyRef}
        label={LABEL_ADD_NEW_KEY}
        robotName={robotName}
        onUpload={setValue}
      />
    </>
  )
}
