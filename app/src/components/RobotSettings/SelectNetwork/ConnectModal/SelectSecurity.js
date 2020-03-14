// @flow
import * as React from 'react'
import { SelectField } from '@opentrons/components'

import { SECURITY_NONE, SECURITY_WPA_PSK } from '../constants'
import { LABEL_SECURITY_NONE, LABEL_SECURITY_PSK } from '../i18n'
import { useConnectFormField } from './form-state'
import { FormRow } from './FormRow'

import type { EapOption } from '../types'

export type SelectSecurityProps = {|
  id: string,
  name: string,
  placeholder: string,
  label: string,
  showAllOptions: boolean,
  eapOptions: Array<EapOption>,
  className?: string,
|}

const ALL_SECURITY_OPTIONS = [
  { options: [{ value: SECURITY_NONE, label: LABEL_SECURITY_NONE }] },
  { options: [{ value: SECURITY_WPA_PSK, label: LABEL_SECURITY_PSK }] },
]

const makeEapOptionsGroup = (eapOptions: Array<EapOption>) => ({
  options: eapOptions.map(opt => ({
    value: opt.name,
    label: opt.displayName ?? opt.name,
  })),
})

export const SelectSecurity = (props: SelectSecurityProps) => {
  const {
    id,
    name,
    placeholder,
    label,
    showAllOptions,
    eapOptions,
    className,
  } = props

  const { value, error, setValue, setTouched } = useConnectFormField(name)

  const options = [
    ...(showAllOptions ? ALL_SECURITY_OPTIONS : []),
    makeEapOptionsGroup(eapOptions),
  ]

  return (
    <FormRow label={label} labelFor={id}>
      <SelectField
        {...{
          id,
          name,
          value,
          error,
          placeholder,
          options,
          className,
          menuPosition: 'fixed',
          onValueChange: (_, value) => setValue(value),
          onLoseFocus: () => setTouched(true),
        }}
      />
    </FormRow>
  )
}
