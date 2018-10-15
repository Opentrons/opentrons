// @flow
// UI components for displaying connection info
import * as React from 'react'
import {DropdownField} from '@opentrons/components'
import {CardContentHalf} from '../layout'
import styles from './styles.css'

// TODO(ka, 2018-10-15): break these out into separate files
export function ConnectionStatusMessage () {
  return (
    <div className={styles.connection_status}>
      <p>Your app is currently connected to your robot via [ Wifi | USB ]</p>
      <p>
        <strong>Internet: </strong>None (the host is not connected to any
        network.)
      </p>
    </div>
  )
}

export function WirelessInfo () {
  return (
    <React.Fragment>
      <CardContentHalf>
        <AvailableNetworks />
      </CardContentHalf>
      <CardContentHalf>
        <WirelessAddresses />
      </CardContentHalf>
    </React.Fragment>
  )
}

function AvailableNetworks () {
  return (
    <React.Fragment>
      <h4 className={styles.connection_label}>Wifi</h4>
      <DropdownField
        className={styles.wifi_dropdown}
        onChange={e => console.log(e.target.value)}
        options={[
          {name: 'WIFI1', value: 'wifi1'},
          {name: 'Wifi2', value: 'wifi2'},
        ]}
      />
    </React.Fragment>
  )
}

function WirelessAddresses () {
  return (
    <div className={styles.wireless_info}>
      <p>
        <span className={styles.connection_label}>Wireless IP: </span>192.168.2.161
      </p>
      <p>
        <span className={styles.connection_label}>Wireless MAC address: </span>192.168.2.161
      </p>
    </div>
  )
}

export function WiredInfo () {
  return (
    <React.Fragment>
      <CardContentHalf>
        <h4 className={styles.connection_label}>USB</h4>
      </CardContentHalf>
      <CardContentHalf>
        <div className={styles.wired_info}>
          <p>
            <span className={styles.connection_label}>Wired IP: </span>192.168.2.161
          </p>
          <p>
            <span className={styles.connection_label}>Wired MAC address: </span>192.168.2.161
          </p>
        </div>
      </CardContentHalf>
    </React.Fragment>
  )
}
