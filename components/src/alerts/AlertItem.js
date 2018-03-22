// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'
import {IconButton} from '../buttons'
import styles from './alerts.css'

export type AlertProps = {
  /** name constant of the icon to display */
  type: 'success' | 'warning' | 'error',
  /** title/main message of colored alert bar */
  title: string,
  /** Alert message body contents */
  children?: React.Node,
  /** Additional class name */
  className?: string,
  /** optional handler to show close button/clear alert  */
  onCloseClick?: () => mixed,
}

/**
 * Alert overlay,
 * change style and icon by using type 'success' 'warning' 'error'
 */

const ALERT_PROPS_BY_TYPE = {
  success: {
    iconName: 'check-circle',
    className: styles.success
  },
  warning: {
    iconName: 'alert-circle',
    className: styles.warning
  },
  error: {
    iconName: 'close-circle',
    className: styles.error
  }
}

export type AlertType = $Keys<typeof ALERT_PROPS_BY_TYPE>

export default function AlertItem (props: AlertProps) {
  const alertProps = ALERT_PROPS_BY_TYPE[props.type]
  const className = cx(
    styles.alert,
    alertProps.className,
    {[styles.alert_body]: props.children}
  )
  return (
    <div className={className}>
      <div className={styles.title_bar}>
        <Icon name={alertProps.iconName} className={styles.icon}/>
        <span className={styles.title}>
          {props.title}
        </span>
        {props.onCloseClick && (
          <IconButton name='close' onClick={props.onCloseClick} className={styles.close}/>
        )}
      </div>
      {props.children && (
        <div className = {styles.message}>
          {props.children}
        </div>
      )}
    </div>
  )
}
