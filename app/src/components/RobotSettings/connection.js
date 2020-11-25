// @flow
// UI components for displaying connection info
import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import cx from 'classnames'
import {
  Text,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import { CONNECTABLE, REACHABLE } from '../../discovery'
import { CardContentHalf } from '../layout'
import styles from './styles.css'

import type {
  InternetStatus,
  SimpleInterfaceStatus,
} from '../../networking/types'

const USB: 'USB' = 'USB'
const WI_FI: 'Wi-Fi' = 'Wi-Fi'

const boldProps: React.ElementProps<typeof Text> = {
  as: 'span',
  fontWeight: FONT_WEIGHT_SEMIBOLD,
  textTransform: TEXT_TRANSFORM_CAPITALIZE,
}

type ConnectionStatusProps = {|
  type: typeof USB | typeof WI_FI,
  ipAddress: string,
  status: typeof CONNECTABLE | typeof REACHABLE,
  internetStatus: InternetStatus | null,
|}

export function ConnectionStatusMessage(
  props: ConnectionStatusProps
): React.Node {
  const { type, ipAddress, status, internetStatus } = props

  return (
    <div className={styles.connection_status}>
      <Text>
        <Trans
          i18nKey={
            status === CONNECTABLE
              ? 'robot_settings.connection.connected_description'
              : 'robot_settings.connection.disconnected_description'
          }
          tOptions={{
            ip: ipAddress,
            type: type,
          }}
        />
      </Text>
      <Text>
        <Trans
          i18nKey={`robot_settings.connection.status.${internetStatus ||
            'unknown'}`}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
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
  const { wired, disabled, connection } = props
  const { t } = useTranslation()
  const unknown = t('robot_settings.unknown')
  const type = wired
    ? t('robot_settings.connection.wired')
    : t('robot_settings.connection.wireless')
  const ip = connection?.ipAddress || unknown
  const subnet = connection?.subnetMask || unknown
  const mac = connection?.macAddress || unknown

  return (
    <div className={cx(styles.wireless_info, { [styles.disabled]: disabled })}>
      <Text>
        <Trans
          i18nKey="robot_settings.connection.ip"
          tOptions={{ type, ip }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
      <Text>
        <Trans
          i18nKey="robot_settings.connection.subnet"
          tOptions={{ type, subnet }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
      <Text>
        <Trans
          i18nKey="robot_settings.connection.mac"
          tOptions={{ type, mac }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
    </div>
  )
}
