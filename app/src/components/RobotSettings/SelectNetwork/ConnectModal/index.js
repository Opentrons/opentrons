// @flow
import { Formik, useFormikContext } from 'formik'
import * as React from 'react'

import type {
  ConnectFormValues,
  EapOption,
  WifiConfigureRequest,
  WifiKey,
  WifiNetwork,
} from '../types'
import {
  connectFormToConfigureRequest,
  getConnectFormFields,
  validateConnectFormFields,
} from './form-fields'
import { useResetFormOnSecurityChange } from './form-state'
import { FormModal } from './FormModal'

export type ConnectModalProps = {|
  robotName: string,
  network: WifiNetwork | null,
  wifiKeys: Array<WifiKey>,
  eapOptions: Array<EapOption>,
  onConnect: WifiConfigureRequest => mixed,
  onCancel: () => mixed,
|}

export const ConnectModal = (props: ConnectModalProps): React.Node => {
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

export const ConnectModalComponent = (props: ConnectModalProps): React.Node => {
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
