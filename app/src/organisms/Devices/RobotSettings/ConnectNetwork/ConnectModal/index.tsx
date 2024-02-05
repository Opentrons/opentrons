import * as React from 'react'

import { useResetFormOnSecurityChange } from './form-state'
import {
  getConnectFormFields,
  validateConnectFormFields,
  connectFormToConfigureRequest,
} from './form-fields'

import { FormModal } from './FormModal'

import type {
  ConnectFormValues,
  WifiConfigureRequest,
  WifiNetwork,
  WifiKey,
  EapOption,
} from '../types'
import { Control, useForm } from 'react-hook-form'

export interface ConnectModalProps {
  robotName: string
  network: WifiNetwork | null
  wifiKeys: WifiKey[]
  eapOptions: EapOption[]
  isValid: boolean
  onConnect: (r: WifiConfigureRequest) => void
  onCancel: () => void
  values: ConnectFormValues
  control: Control<ConnectFormValues, any>
}

export const ConnectModal = (props: ConnectModalProps): JSX.Element => {
  const { network, eapOptions, onConnect } = props

  const onSubmit = (values: ConnectFormValues): void => {
    const request = connectFormToConfigureRequest(network, values)
    if (request) onConnect(request)
  }

  const handleValidate = (
    data: ConnectFormValues
  ): ReturnType<typeof validateConnectFormFields> => {
    return validateConnectFormFields(network, eapOptions, data)
  }

  const {
    handleSubmit,
    formState: { isValid },
    getValues,
    control,
  } = useForm<ConnectFormValues>({
    defaultValues: {},
    resolver: handleValidate,
  })

  const values = getValues()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ConnectModalComponent
        {...props}
        control={control}
        values={values}
        isValid={isValid}
      />
    </form>
  )
}

export const ConnectModalComponent = (
  props: ConnectModalProps
): JSX.Element => {
  const {
    robotName,
    network,
    wifiKeys,
    eapOptions,
    onCancel,
    values,
    isValid,
    control,
  } = props

  const id = `ConnectForm__${robotName}`
  const fields = getConnectFormFields(
    network,
    robotName,
    eapOptions,
    wifiKeys,
    values
  )

  useResetFormOnSecurityChange()

  return (
    <FormModal
      {...{
        id,
        network,
        fields,
        isValid,
        onCancel,
        control,
      }}
    />
  )
}
