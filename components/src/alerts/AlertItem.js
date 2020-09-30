// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, type IconProps } from '../icons'
import { IconButton } from '../buttons'
import styles from './alerts.css'

export type AlertItemProps = {|
  /** name constant of the icon to display */
  type: 'success' | 'warning' | 'error' | 'info',
  /** title/main message of colored alert bar */
  title: string | React.Node,
  /** Alert message body contents */
  children?: React.Node,
  /** Additional class name */
  className?: string,
  /** optional handler to show close button/clear alert  */
  onCloseClick?: () => mixed,
  /** Override the default Alert Icon */
  icon?: IconProps,
|}

/**
 * Alert overlay,
 * change style and icon by using type 'success' 'warning' 'error'
 */

const ALERT_PROPS_BY_TYPE = {
  success: {
    icon: { name: 'check-circle' },
    className: styles.success,
  },
  error: {
    icon: { name: 'alert-circle' },
    className: styles.error,
  },
  warning: {
    icon: { name: 'alert-circle' },
    className: styles.warning,
  },
  info: {
    icon: { name: 'information' },
    className: styles.info,
  },
}

export type AlertType = $Keys<typeof ALERT_PROPS_BY_TYPE>

export function AlertItem(props: AlertItemProps): React.Node {
  const alertProps = ALERT_PROPS_BY_TYPE[props.type]
  const icon = props.icon ? props.icon : alertProps.icon
  const className = cx(styles.alert, alertProps.className, props.className)

  const iconProps = {
    ...icon,
    className: styles.icon,
  }

  return (
    <div className={className}>
      <div className={styles.title_bar}>
        <Icon {...iconProps} />
        <span className={styles.title}>{props.title}</span>
        {props.onCloseClick && (
          <IconButton
            name="close"
            onClick={props.onCloseClick}
            className={styles.close}
          />
        )}
      </div>
      {props.children && <div className={styles.message}>{props.children}</div>}
    </div>
  )
}
