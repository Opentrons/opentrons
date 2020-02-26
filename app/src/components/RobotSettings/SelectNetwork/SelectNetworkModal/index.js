// @flow

import * as React from 'react'

import { Portal } from '../../../portal'

import { ConnectDisconnectModal } from './ConnectDisconnectModal'
import { SpinnerModal } from '@opentrons/components'
import { WifiConnectModal } from './WifiConnectModal'

// import type { NetworkingType } from '../types'

import { formatLoaderMessage } from './utils'

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
  handleCancel,
  handleDisconnectWifi,
  eapOptions,
  keys,
  dispatchConfigure,
  configRequest,
  configError,
  configResponse,
  response,
  error,
}: Object) => {
  const showSpinner = connectingTo || pending
  const showConfig = configRequest && !!(configError || configResponse)
  const showWifiConnect = showConfig || failure

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
          handleCancel={handleCancel}
          addKey={addKey}
          handleDisconnectWifi={handleDisconnectWifi}
          eapOptions={eapOptions}
          keys={keys}
          dispatchConfigure={dispatchConfigure}
        />
      )}
      {showWifiConnect && (
        <WifiConnectModal
          error={showConfig ? configError : error}
          request={showConfig ? configRequest : { ssid: previousSsid }}
          response={showConfig ? configResponse : response}
          close={close}
        />
      )}
    </Portal>
  )
}
