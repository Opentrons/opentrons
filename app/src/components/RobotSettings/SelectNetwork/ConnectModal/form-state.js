// @flow
import { usePrevious } from '@opentrons/components'
import { useField, useFormikContext } from 'formik'
import { useEffect } from 'react'

import type { ConnectFormFieldProps, ConnectFormValues } from '../types'

export const useResetFormOnSecurityChange = () => {
  const {
    values,
    errors,
    touched,
    setValues,
    setErrors,
    setTouched,
  } = useFormikContext<ConnectFormValues>()

  const ssid = values.ssid
  const ssidTouched = touched.ssid
  const ssidError = errors.ssid
  const securityType = values.securityType
  const prevSecurityType = usePrevious(securityType)

  useEffect(() => {
    if (prevSecurityType && securityType !== prevSecurityType) {
      setErrors({ ssid: ssidError })
      setTouched({ ssid: ssidTouched, securityType: true }, false)
      setValues({ ssid, securityType })
    }
  }, [
    ssid,
    ssidTouched,
    ssidError,
    securityType,
    prevSecurityType,
    setTouched,
    setErrors,
    setValues,
  ])
}

export const useConnectFormField = (name: string): ConnectFormFieldProps => {
  const [fieldProps, fieldMeta, fieldHelpers] = useField<string | void>(name)
  const { value, onChange, onBlur } = fieldProps
  const { setValue, setTouched } = fieldHelpers
  const error = fieldMeta.touched ? fieldMeta.error : null

  return {
    value: value ?? null,
    error: error ?? null,
    onChange,
    onBlur,
    setValue,
    setTouched,
  }
}
