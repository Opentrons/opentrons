// @flow
// UI components for displaying connection info
import * as React from 'react'
import Select, {components} from 'react-select'
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

  const selectStyles = {
    option: base => ({
      ...base,
      padding: '0.25rem 0',
    }),
    input: () => ({
      marginTop: '-0.25rem',
      marginLeft: 0,
    }),
    container: base => ({
      ...base,
      backgroundColor: 'transparent',
      height: '2rem',
      overflow: 'visible',
    }),
    control: () => ({
      backgroundColor: '#e5e2e2',
      border: 'none',
      padding: '0.25rem 0rem',
      outline: 'none',
      borderRadius: '3px',
      height: '1.75rem',
      boxShadow: 'none',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  }
  // Custom dropdown indicator icon component needed to match comp lib
  const DropdownIndicator = props => {
    return (
      components.DropdownIndicator && (
        <components.DropdownIndicator {...props}>
          <div className={styles.dropdown_icon}>
            <Icon name="menu-down" width="100%" />
          </div>
        </components.DropdownIndicator>
      )
    )
  }
  // custom Menu (options dropdown) component
  const Menu = props => {
    return (
      <components.Menu {...props}>
        <div className={styles.options_menu}>{props.children}</div>
      </components.Menu>
    )
  }

  return (
    <Select
      className={styles.wifi_dropdown}
      isDisabled={disabled}
      value={selectedOption}
      onChange={onChange}
      options={options}
      styles={selectStyles}
      components={{DropdownIndicator, Menu}}
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
      <span className={styles.wifi_name}>{value}</span>
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
