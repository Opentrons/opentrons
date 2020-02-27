// @flow

import * as React from 'react'

import { Portal } from '../../../portal'

import { ConnectDisconnectModal } from './ConnectDisconnectModal'
import { SpinnerModal } from '@opentrons/components'
import { NetworkAlertModal } from './NetworkAlertModal'

import { formatLoaderMessage } from './utils'

// TODO: (isk: 2/27/20): type this component and split up
export const SelectNetworkModal = ({
  addKey,
  close,
  connectingTo,
  pending,
  failure,
  modalOpen,
  ssid,
  previousSsid,
  networkingType,
  securityType,
  onCancel,
  onDisconnectWifi,
  eapOptions,
  keys,
  dispatchConfigure,
  configRequest,
  configError,
  configResponse,
  response,
  error,
}: any) => {
  const showSpinner = connectingTo || pending
  const showConfig = configRequest && !!(configError || configResponse)
  const showAlert = showConfig || failure

  return (
    <Portal>
      {showSpinner && (
        <SpinnerModal
          message={formatLoaderMessage(connectingTo, ssid)}
          alertOverlay
        />
      )}
      {modalOpen && (
        <ConnectDisconnectModal
          ssid={ssid}
          previousSsid={previousSsid}
          networkingType={networkingType}
          securityType={securityType}
          onCancel={onCancel}
          addKey={addKey}
          onDisconnectWifi={onDisconnectWifi}
          eapOptions={eapOptions}
          keys={keys}
          dispatchConfigure={dispatchConfigure}
        />
      )}
      {showAlert && (
        <NetworkAlertModal
          error={showConfig ? configError : error}
          request={showConfig ? configRequest : { ssid: previousSsid }}
          response={showConfig ? configResponse : response}
          close={close}
        />
      )}
    </Portal>
  )
}
