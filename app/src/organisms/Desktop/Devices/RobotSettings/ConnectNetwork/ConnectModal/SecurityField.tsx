import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SelectField } from '@opentrons/components'

import { SECURITY_NONE, SECURITY_WPA_PSK } from '../constants'
import { useConnectFormField } from './form-state'
import { FormRow } from './FormRow'

import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
} from 'react-hook-form'
import type { EapOption } from '../types'

export interface SecurityFieldProps {
  id: string
  name: string
  placeholder: string
  label: string
  showAllOptions: boolean
  eapOptions: EapOption[]
  field: ControllerRenderProps<FieldValues, any>
  fieldState: ControllerFieldState
  className?: string
}

const makeEapOptionsGroup = (
  eapOptions: EapOption[]
): { options: Array<{ value: string; label: string }> } => ({
  options: eapOptions.map(opt => ({
    value: opt.name,
    label: opt.displayName ?? opt.name,
  })),
})

export const SecurityField = (props: SecurityFieldProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const {
    id,
    name,
    placeholder,
    label,
    showAllOptions,
    eapOptions,
    className,
    field,
    fieldState,
  } = props

  const { value, error, setValue, setTouched } = useConnectFormField(
    field,
    fieldState
  )

  const noneText = t('shared:none')
  const wpa2PersonalText = t('wpa2_personal')
  const allSecurityOptions = useMemo(
    () => [
      { options: [{ value: SECURITY_NONE, label: noneText }] },
      { options: [{ value: SECURITY_WPA_PSK, label: wpa2PersonalText }] },
    ],
    [noneText, wpa2PersonalText]
  )

  const options = [
    ...(showAllOptions ? allSecurityOptions : []),
    makeEapOptionsGroup(eapOptions),
  ]

  return (
    <FormRow label={t(label)} labelFor={id}>
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
