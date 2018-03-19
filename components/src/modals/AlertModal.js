// @flow
import * as React from 'react'

import {FlatButton, type ButtonProps} from '../buttons'
import Modal from './Modal'
import styles from './modals.css'

type Props = {
  /** optional handler for overlay click */
  onCloseClick?: () => mixed,
  /** optional modal heading */
  heading?: React.Node,
  /** optional array of `ButtonProps` for `FlatButton`s at bottom of modal */
  buttons?: Array<?ButtonProps>,
  /** modal contents */
  children: React.Node,
  /** optional classes to apply */
  className?: string
}

/**
 * Generic alert modal with a heading and a set of buttons at the bottom
 */
export default function AlertModal (props: Props) {
  const {heading, buttons, className, onCloseClick} = props

  return (
    <Modal className={className} onCloseClick={onCloseClick}>
      <div className={styles.alert_modal_contents}>
        {heading && (
          <div className={styles.alert_modal_heading}>
            {heading}
          </div>
        )}
        {props.children}
      </div>
      {buttons && (
        <div className={styles.alert_modal_buttons}>
          {buttons.filter(Boolean).map((button, index) => (
            <FlatButton key={index} {...button} />
          ))}
        </div>
      )}
    </Modal>
  )
}
