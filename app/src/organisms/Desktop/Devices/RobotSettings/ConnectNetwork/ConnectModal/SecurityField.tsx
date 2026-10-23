import { useTranslation } from 'react-i18next'

import { SelectField } from '@opentrons/components'

import { SECURITY_NONE, SECURITY_WPA_PSK } from '../constants'
import { useConnectFormField } from './form-state'
import { FormRow } from './FormRow'

import type { ReactNode } from 'react'
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

export const SecurityField = (props: SecurityFieldProps): ReactNode => {
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

  const allSecurityOptions = [
    { options: [{ value: SECURITY_NONE, label: t('shared:none') }] },
    { options: [{ value: SECURITY_WPA_PSK, label: t('wpa2_personal') }] },
  ]

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
