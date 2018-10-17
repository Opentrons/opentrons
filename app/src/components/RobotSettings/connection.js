// @flow
// UI components for displaying connection info
import * as React from 'react'
import Select from 'react-select'
import find from 'lodash/find'
import {Icon} from '@opentrons/components'
import {CardContentHalf} from '../layout'
import styles from './styles.css'

import type {IconName} from '@opentrons/components'
import type {
  InternetStatus,
  NetworkInterface,
  WifiNetworkList,
  WifiNetwork,
} from '../../http-api-client'

type ConnectionStatusProps = {type: string, status: ?InternetStatus}

function shortStatusToDescription (status: ?InternetStatus) {
  switch (status) {
    case 'full':
      return 'The robot is connected to a network and has full access to the Internet.'
    case 'portal':
      return 'The robot is behind a captive portal and cannot reach the full Internet.'
    case 'limited':
      return 'The  robot is connected to a network, but it has no access to the Internet.'
    case 'none':
      return 'The robot is not connected to any network.'
  }

  return 'Unknown'
}

export function ConnectionStatusMessage (props: ConnectionStatusProps) {
  const {type, status} = props

  return (
    <div className={styles.connection_status}>
      <p>Your app is currently connected to your robot via {type}</p>
      <p>
        <strong>Internet: </strong>
        {shortStatusToDescription(status)}
      </p>
    </div>
  )
}

type ConnectionInfoProps = {
  connection: ?NetworkInterface,
  title: string,
  wired?: boolean,
  children?: React.Node,
}

export function ConnectionInfo (props: ConnectionInfoProps) {
  const {connection, title, wired, children} = props

  return (
    <React.Fragment>
      <CardContentHalf>
        <h4 className={styles.connection_label}>{title}</h4>
        {children}
      </CardContentHalf>
      <CardContentHalf>
        <NetworkAddresses connection={connection} wired={wired} />
      </CardContentHalf>
    </React.Fragment>
  )
}

type SelectNetworkOption = {
  ...$Exact<WifiNetwork>,
  value: string,
  label: React.Node,
}

type NetworkDropdownProps = {
  list: ?WifiNetworkList,
  value: ?string,
  disabled: boolean,
  onChange: SelectNetworkOption => mixed,
}

export function NetworkDropdown (props: NetworkDropdownProps) {
  const {value, disabled, onChange} = props
  const list = props.list || []
  const options = list.map(NetworkOption)
  const selectedOption = find(options, {value})

  return (
    <Select
      className={styles.wifi_dropdown}
      isDisabled={disabled}
      value={selectedOption}
      onChange={onChange}
      options={options}
    />
  )
}

function NetworkOption (nw: WifiNetwork): SelectNetworkOption {
  const value = nw.ssid
  const connectedIcon = nw.active ? (
    <Icon name="check" className={styles.wifi_option_icon} />
  ) : (
    <span className={styles.wifi_option_icon} />
  )

  const securedIcon =
    nw.securityType !== 'none' ? (
      <Icon name="lock" className={styles.wifi_option_icon_right} />
    ) : (
      <span className={styles.wifi_option_icon_right} />
    )

  let signalIconName: IconName
  if (nw.signal <= 25) {
    signalIconName = 'ot-wifi-0'
  } else if (nw.signal <= 50) {
    signalIconName = 'ot-wifi-1'
  } else if (nw.signal <= 75) {
    signalIconName = 'ot-wifi-2'
  } else {
    signalIconName = 'ot-wifi-3'
  }
  const signalIcon = (
    <Icon name={signalIconName} className={styles.wifi_option_icon_right} />
  )

  const label = (
    <div className={styles.wifi_option}>
      {connectedIcon}
      {value}
      {signalIcon}
      {securedIcon}
    </div>
  )

  return {...nw, value, label}
}

type NetworkAddressProps = {
  connection: ?NetworkInterface,
  wired: ?boolean,
}

function NetworkAddresses (props: NetworkAddressProps) {
  const type = props.wired ? 'Wired' : 'Wireless'
  const ip = (props.connection && props.connection.ipAddress) || 'Unknown'
  const mac = (props.connection && props.connection.macAddress) || 'Unknown'

  return (
    <div className={styles.wireless_info}>
      <p>
        <span className={styles.connection_label}>{type} IP: </span>
        {ip}
      </p>
      <p>
        <span className={styles.connection_label}>{type} MAC address: </span>
        {mac}
      </p>
    </div>
  )
}
