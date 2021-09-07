// UI components for displaying connection info
import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import cx from 'classnames'
import {
  Text,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import { CONNECTABLE, REACHABLE } from '../../../redux/discovery'
import { CardContentHalf } from '../../../atoms/layout'
import styles from './styles.css'

import type {
  InternetStatus,
  SimpleInterfaceStatus,
} from '../../../redux/networking/types'

const USB: 'USB' = 'USB'
const WI_FI: 'Wi-Fi' = 'Wi-Fi'

const boldProps: React.ComponentProps<typeof Text> = {
  as: 'span',
  fontWeight: FONT_WEIGHT_SEMIBOLD,
  textTransform: TEXT_TRANSFORM_CAPITALIZE,
}

interface ConnectionStatusProps {
  type: typeof USB | typeof WI_FI
  ipAddress: string
  status: typeof CONNECTABLE | typeof REACHABLE
  internetStatus: InternetStatus | null
}

export function ConnectionStatusMessage(
  props: ConnectionStatusProps
): JSX.Element {
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
          // @ts-expect-error TODO: use `defaults` prop instead of `defaultValue`
          defaultValue={t('shared:unknown')}
          components={{ bold: <Text {...boldProps} /> }}
        />
      </Text>
    </div>
  )
}

interface ConnectionInfoProps {
  connection: SimpleInterfaceStatus | null
  title: string
  wired?: boolean
  children?: React.ReactNode
  disabled: boolean | null | undefined
}

export function ConnectionInfo(props: ConnectionInfoProps): JSX.Element {
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

interface NetworkAddressProps {
  connection: SimpleInterfaceStatus | null
  wired: boolean | null | undefined
  disabled: boolean | null | undefined
}

function NetworkAddresses(props: NetworkAddressProps): JSX.Element {
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
