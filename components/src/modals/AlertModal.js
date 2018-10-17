// @flow
import * as React from 'react'
import cx from 'classnames'

import {OutlineButton, type ButtonProps} from '../buttons'
import {Icon, type IconName} from '../icons'
import Modal from './Modal'
import styles from './modals.css'

type Props = {
  /** optional handler for overlay click */
  onCloseClick?: () => mixed,
  /** optional modal heading */
  heading?: React.Node,
  /** optional array of `ButtonProps` for `OutlineButton`s at bottom of modal */
  buttons?: Array<?ButtonProps>,
  /** modal contents */
  children: React.Node,
  /** optional classes to apply */
  className?: string,
  /** optional classes to apply */
  contentsClassName?: string,
  /** lightens overlay (alert modal over existing modal) */
  alertOverlay?: boolean,
  /** override default alert icon */
  iconName?: IconName,
}

/**
 * Generic alert modal with a heading and a set of buttons at the bottom
 */
export default function AlertModal (props: Props) {
  const {heading, buttons, className, onCloseClick, alertOverlay} = props
  const iconName = props.iconName || 'alert'
  const wrapperStyle = cx(
    styles.alert_modal_wrapper,
    {
      [styles.no_alert_header]: !heading,
    },
    props.contentsClassName
  )

  return (
    <Modal
      className={className}
      contentsClassName={wrapperStyle}
      onCloseClick={onCloseClick}
      alertOverlay={alertOverlay}
    >
      {heading && (
        <div className={styles.alert_modal_heading}>
          <Icon name={iconName} className={styles.alert_modal_icon} />
          {heading}
        </div>
      )}
      <div className={styles.alert_modal_contents}>{props.children}</div>
      {buttons && (
        <div className={styles.alert_modal_buttons}>
          {buttons
            .filter(Boolean)
            .map((button, index) => (
              <OutlineButton
                key={index}
                {...button}
                className={cx(styles.alert_button, button.className)}
              />
            ))}
        </div>
      )}
    </Modal>
  )
}
