import * as React from 'react'
import { Control, useForm, Resolver } from 'react-hook-form'

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

export interface ConnectModalProps {
  robotName: string
  network: WifiNetwork | null
  wifiKeys: WifiKey[]
  eapOptions: EapOption[]
  onConnect: (r: WifiConfigureRequest) => void
  onCancel: () => void
}

interface ConnectModalComponentProps extends ConnectModalProps {
  isValid: boolean
  values: ConnectFormValues
  control: Control<ConnectFormValues, any>
}

export const ConnectModal = (props: ConnectModalProps): JSX.Element => {
  const { network, eapOptions, onConnect } = props

  const onSubmit = (values: ConnectFormValues): void => {
    const request = connectFormToConfigureRequest(network, values)
    if (request) onConnect(request)
  }

  const handleValidate: Resolver<ConnectFormValues> = values => {
    let errors = {}

    errors = validateConnectFormFields(network, eapOptions, values, errors)
    return { values, errors }
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
  props: ConnectModalComponentProps
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
