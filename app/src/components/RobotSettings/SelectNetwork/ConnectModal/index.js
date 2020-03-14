// @flow
import * as React from 'react'
import { Formik, useFormikContext } from 'formik'

import { useResetFormOnSecurityChange } from './form-state'
import {
  getConnectFormFields,
  validateConnectFormFields,
  connectFormToConfigureRequest,
} from './form-fields'

import { ConnectFormModal } from './ConnectFormModal'

import type {
  ConnectFormValues,
  WifiConfigureRequest,
  WifiNetwork,
  WifiKey,
  EapOption,
} from '../types'

export type ConnectModalProps = {|
  robotName: string,
  network: WifiNetwork | null,
  wifiKeys: Array<WifiKey>,
  eapOptions: Array<EapOption>,
  onConnect: WifiConfigureRequest => mixed,
  onCancel: () => mixed,
|}

export const ConnectModal = (props: ConnectModalProps) => {
  const { network, eapOptions, onConnect } = props

  const handleSubmit = (values: ConnectFormValues) => {
    const request = connectFormToConfigureRequest(network, values)
    if (request) onConnect(request)
  }

  const handleValidate = (values: ConnectFormValues) => {
    return validateConnectFormFields(network, eapOptions, values)
  }

  return (
    <Formik
      initialValues={({}: ConnectFormValues)}
      onSubmit={handleSubmit}
      validate={handleValidate}
      validateOnMount
    >
      <ConnectModalComponent {...props} />
    </Formik>
  )
}

export const ConnectModalComponent = (props: ConnectModalProps) => {
  const { robotName, network, wifiKeys, eapOptions, onCancel } = props
  const { values, isValid } = useFormikContext<ConnectFormValues>()
  const fields = getConnectFormFields(network, eapOptions, values)

  useResetFormOnSecurityChange()

  return (
    <ConnectFormModal
      {...{
        robotName,
        network,
        fields,
        wifiKeys,
        eapOptions,
        isValid,
        onCancel,
      }}
    />
  )
}
