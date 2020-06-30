// @flow
// UI components for displaying connection info
import * as React from 'react'
import cx from 'classnames'
import { CardContentHalf } from '../layout'
import type {
  InternetStatus,
  SimpleInterfaceStatus,
} from '../../networking/types'
import styles from './styles.css'

type ConnectionStatusProps = { type: string, status: ?InternetStatus }

function shortStatusToDescription(status: ?InternetStatus) {
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

export function ConnectionStatusMessage(
  props: ConnectionStatusProps
): React.Node {
  const { type, status } = props

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
  connection: SimpleInterfaceStatus | null,
  title: string,
  wired?: boolean,
  children?: React.Node,
  disabled: ?boolean,
}

export function ConnectionInfo(props: ConnectionInfoProps): React.Node {
  const { connection, title, wired, children, disabled } = props
  const labelStyles = cx(styles.connection_label, {
    [styles.disabled]: disabled,
  })

  return (
    <React.Fragment>
      <CardContentHalf>
        <h4 className={labelStyles}>{title}</h4>
        {children}
      </CardContentHalf>
      <CardContentHalf>
        <NetworkAddresses
          connection={connection}
          wired={wired}
          disabled={disabled}
        />
      </CardContentHalf>
    </React.Fragment>
  )
}

type NetworkAddressProps = {
  connection: SimpleInterfaceStatus | null,
  wired: ?boolean,
  disabled: ?boolean,
}

function NetworkAddresses(props: NetworkAddressProps) {
  const type = props.wired ? 'Wired' : 'Wireless'
  const ip = props.connection?.ipAddress || 'Unknown'
  const subnet = props.connection?.subnetMask || 'Unknown'
  const mac = props.connection?.macAddress || 'Unknown'
  const labelStyles = cx(styles.connection_label, {
    [styles.disabled]: props.disabled,
  })

  return (
    <div className={styles.wireless_info}>
      <p>
        <span className={labelStyles}>{type} IP: </span>
        {ip}
      </p>
      <p>
        <span className={labelStyles}>{type} Subnet Mask: </span>
        {subnet}
      </p>
      <p>
        <span className={labelStyles}>{type} MAC Address: </span>
        {mac}
      </p>
    </div>
  )
}
