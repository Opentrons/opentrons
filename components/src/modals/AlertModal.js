// @flow
import cx from 'classnames'
import * as React from 'react'

import { type ButtonProps, OutlineButton } from '../buttons'
import { type IconName, Icon } from '../icons'
import { Modal } from './Modal'
import styles from './modals.css'

export type AlertModalProps = {|
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
  iconName?: ?IconName,
  /** restricts scroll outside of Modal when open, true by default */
  restrictOuterScroll?: boolean,
|}

/**
 * Generic alert modal with a heading and a set of buttons at the bottom
 */
export function AlertModal(props: AlertModalProps): React.Node {
  const {
    heading,
    buttons,
    className,
    onCloseClick,
    alertOverlay,
    restrictOuterScroll,
  } = props
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
      restrictOuterScroll={restrictOuterScroll}
    >
      {heading && (
        <div
          className={cx(styles.alert_modal_heading, {
            [styles.no_icon_heading]: props.iconName === null,
          })}
        >
          {props.iconName !== null && (
            <Icon name={iconName} className={styles.alert_modal_icon} />
          )}
          {heading}
        </div>
      )}
      <div className={styles.alert_modal_contents}>{props.children}</div>
      {buttons && (
        <div className={styles.alert_modal_buttons}>
          {buttons.filter(Boolean).map((button, index) => (
            <OutlineButton
              {...button}
              className={cx(styles.alert_button, button.className)}
              key={index}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
