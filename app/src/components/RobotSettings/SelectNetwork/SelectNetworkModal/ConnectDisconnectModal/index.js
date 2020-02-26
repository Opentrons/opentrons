// @flow
import * as React from 'react'

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../../../networking'

import { ConnectForm } from './ConnectForm'
import { ScrollableAlertModal, BottomButtonBar } from '../../../../modals'

import type {
  WifiSecurityType,
  WifiEapOptionsList,
  WifiConfigureRequest,
  WifiKeysList,
} from '../../../../../http-api-client'

import type { NetworkingType } from '../../types'

import { formatHeading, formatBody } from './utils'

import { DISCONNECT } from '../../constants'

import styles from './styles.css'

export type ConnectDisconnectModalProps = {|
  ssid: ?string,
  previousSsid: ?string,
  networkingType: ?NetworkingType,
  securityType: ?WifiSecurityType,
  handleCancel: () => mixed,
  addKey: () => mixed,
  handleDisconnectWifi: () => mixed,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  dispatchConfigure: WifiConfigureRequest => mixed,
|}

export const ConnectDisconnectModal = ({
  ssid,
  previousSsid,
  networkingType,
  securityType,
  handleCancel,
  handleDisconnectWifi,
  eapOptions,
  keys,
  dispatchConfigure,
  addKey,
}: ConnectDisconnectModalProps) => (
  <ScrollableAlertModal
    alertOverlay
    heading={formatHeading(ssid, previousSsid, networkingType)}
    iconName="wifi"
    onCloseClick={handleCancel}
  >
    <p className={styles.connect_modal_copy}>
      {formatBody(ssid, previousSsid, networkingType, securityType)}
    </p>
    {networkingType === DISCONNECT ? (
      <BottomButtonBar
        buttons={[
          { children: 'Cancel', onClick: handleCancel },
          {
            children: 'Disconnect',
            onClick: handleDisconnectWifi,
          },
        ]}
      />
    ) : (
      <ConnectForm
        ssid={ssid}
        securityType={securityType}
        eapOptions={eapOptions}
        keys={keys}
        configure={dispatchConfigure}
        close={handleCancel}
        addKey={addKey}
      />
    )}
  </ScrollableAlertModal>
)
