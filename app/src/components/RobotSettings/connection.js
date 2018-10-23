// @flow
// UI components for displaying connection info
import * as React from 'react'
import {CardContentHalf} from '../layout'
import styles from './styles.css'

import type {InternetStatus, NetworkInterface} from '../../http-api-client'

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
