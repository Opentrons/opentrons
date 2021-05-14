import * as React from 'react'
import { Formik, useFormikContext } from 'formik'

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
  onConnect: (r: WifiConfigureRequest) => unknown
  onCancel: () => unknown
}

export const ConnectModal = (props: ConnectModalProps): JSX.Element => {
  const { network, eapOptions, onConnect } = props

  const handleSubmit = (values: ConnectFormValues): void => {
    const request = connectFormToConfigureRequest(network, values)
    if (request) onConnect(request)
  }

  const handleValidate = (
    values: ConnectFormValues
  ): ReturnType<typeof validateConnectFormFields> => {
    return validateConnectFormFields(network, eapOptions, values)
  }

  return (
    <Formik
      initialValues={{}}
      onSubmit={handleSubmit}
      validate={handleValidate}
      validateOnMount
    >
      <ConnectModalComponent {...props} />
    </Formik>
  )
}

export const ConnectModalComponent = (
  props: ConnectModalProps
): JSX.Element => {
  const { robotName, network, wifiKeys, eapOptions, onCancel } = props
  const { values, isValid } = useFormikContext<ConnectFormValues>()

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
      }}
    />
  )
}
