// @flow
import * as React from 'react'

import { SelectField } from '@opentrons/components'
import type { SelectFieldProps } from '@opentrons/components'

import {
  SECURITY_NONE,
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  LABEL_SECURITY_NONE,
  LABEL_SECURITY_PSK,
} from './constants'

import { FormTableRow } from './FormTableRow'

import type { EapOption, WifiSecurityType, ConnectFormValues } from './types'

export type SelectSecurityProps = {|
  id: $PropertyType<SelectFieldProps, 'id'>,
  name: $PropertyType<SelectFieldProps, 'name'>,
  placeholder: $PropertyType<SelectFieldProps, 'placeholder'>,
  error: $PropertyType<SelectFieldProps, 'error'>,
  onLoseFocus: $PropertyType<SelectFieldProps, 'onLoseFocus'>,
  label: string,
  values: ConnectFormValues,
  showAll: boolean,
  eapOptions: Array<EapOption>,
  className?: string,
  onSecurityChange: ({|
    securityType: WifiSecurityType,
    eapConfig?: {| eapType: string |},
  |}) => mixed,
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
    eapOptions,
    showAll,
    values,
    onSecurityChange,
    label,
    ...fieldProps
  } = props

  const value = values.eapConfig?.eapType ?? values.securityType ?? null
  const options = [
    ...(showAll ? ALL_SECURITY_OPTIONS : []),
    makeEapOptionsGroup(eapOptions),
  ]

  const handleValueChange = (fieldName: string, optionValue: string) => {
    if (optionValue !== value) {
      if (optionValue === SECURITY_NONE || optionValue === SECURITY_WPA_PSK) {
        // NOTE(mc, 2020-03-05): Flow v0.119.1 is unable to figure out this refinement
        onSecurityChange({ securityType: (optionValue: any) })
      } else {
        onSecurityChange({
          securityType: SECURITY_WPA_EAP,
          eapConfig: { eapType: optionValue },
        })
      }
    }
  }

  return (
    <FormTableRow label={label} labelFor={fieldProps.id}>
      <SelectField
        {...fieldProps}
        options={options}
        value={value}
        onValueChange={handleValueChange}
        menuPosition="fixed"
      />
    </FormTableRow>
  )
}
