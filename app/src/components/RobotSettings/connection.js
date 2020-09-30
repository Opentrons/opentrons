// @flow
// UI components for displaying connection info
import * as React from 'react'
import cx from 'classnames'

import { CONNECTABLE, REACHABLE } from '../../discovery'
import { CardContentHalf } from '../layout'
import styles from './styles.css'

import type {
  InternetStatus,
  SimpleInterfaceStatus,
} from '../../networking/types'

const USB: 'USB' = 'USB'
const WI_FI: 'Wi-Fi' = 'Wi-Fi'

type ConnectionStatusProps = {|
  type: typeof USB | typeof WI_FI,
  ipAddress: string,
  status: typeof CONNECTABLE | typeof REACHABLE,
  internetStatus: InternetStatus | null,
|}

const statusToDescription = (
  status: typeof CONNECTABLE | typeof REACHABLE,
  type: typeof USB | typeof WI_FI,
  ipAddress: string
) => {
  return `Your app is ${
    status === CONNECTABLE ? 'currently connected' : 'trying to connect'
  } to your robot via ${type} at IP address ${ipAddress}`
}

const internetStatusToDescription = (status: InternetStatus | null) => {
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
  const { type, ipAddress, status, internetStatus } = props

  return (
    <div className={styles.connection_status}>
      <p>{statusToDescription(status, type, ipAddress)}</p>
      <p>
        <strong>Internet: </strong>
        {internetStatusToDescription(internetStatus)}
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
  const classNames = cx(styles.wireless_info, {
    [styles.disabled]: props.disabled,
  })

  return (
    <div className={classNames}>
      <p>
        <span className={styles.connection_label}>{type} IP: </span>
        {ip}
      </p>
      <p>
        <span className={styles.connection_label}>{type} Subnet Mask: </span>
        {subnet}
      </p>
      <p>
        <span className={styles.connection_label}>{type} MAC Address: </span>
        {mac}
      </p>
    </div>
  )
}
