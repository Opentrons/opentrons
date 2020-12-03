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
  const { t } = useTranslation(['robot_connection', 'shared'])

  return (
    <div className={styles.connection_status}>
      <Text>
        {status === CONNECTABLE ? (
          <Trans
            t={t}
            i18nKey="connected_description"
            tOptions={{ ip: ipAddress, type: type }}
          />
        ) : (
          <Trans
            t={t}
            i18nKey="disconnected_description"
            tOptions={{ ip: ipAddress, type: type }}
          />
        )}
      </Text>
      <Text>
        <Trans
          t={t}
          i18nKey="internet_status"
          tOptions={{ context: internetStatus }}
          defaultValue={t('shared:unknown')}
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
  const { t } = useTranslation(['robot_connection', 'shared'])
  const unknown = t('shared:unknown')
  const type = wired ? t('wired') : t('wireless')
  const ip = connection?.ipAddress || unknown
  const subnet = connection?.subnetMask || unknown
  const mac = connection?.macAddress || unknown

  return (
    <div className={cx(styles.wireless_info, { [styles.disabled]: disabled })}>
      <Text>
        <Trans
          t={t}
          i18nKey="ip"
          tOptions={{ type, ip }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
      <Text>
        <Trans
          t={t}
          i18nKey="subnet"
          tOptions={{ type, subnet }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
      <Text>
        <Trans
          t={t}
          i18nKey="mac"
          tOptions={{ type, mac }}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
    </div>
  )
}
