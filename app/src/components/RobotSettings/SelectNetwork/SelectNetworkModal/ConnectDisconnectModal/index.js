// @flow
import * as React from 'react'

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
  ssid: string | null,
  previousSsid: string | null,
  networkingType: NetworkingType | null,
  securityType: WifiSecurityType | null,
  onCancel: () => mixed,
  addKey: () => mixed,
  onDisconnectWifi: () => mixed,
  eapOptions: WifiEapOptionsList | null,
  keys: WifiKeysList | null,
  dispatchConfigure: WifiConfigureRequest => mixed,
|}

export const ConnectDisconnectModal = ({
  ssid,
  previousSsid,
  networkingType,
  securityType,
  onCancel,
  onDisconnectWifi,
  eapOptions,
  keys,
  dispatchConfigure,
  addKey,
}: ConnectDisconnectModalProps) => (
  <ScrollableAlertModal
    alertOverlay
    heading={formatHeading(ssid, previousSsid, networkingType)}
    iconName="wifi"
    onCloseClick={onCancel}
  >
    <p className={styles.connect_modal_copy}>
      {formatBody(ssid, previousSsid, networkingType, securityType)}
    </p>
    {networkingType === DISCONNECT ? (
      <BottomButtonBar
        buttons={[
          { children: 'Cancel', onClick: onCancel },
          {
            children: 'Disconnect',
            onClick: onDisconnectWifi,
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
        close={onCancel}
        addKey={addKey}
      />
    )}
  </ScrollableAlertModal>
)
