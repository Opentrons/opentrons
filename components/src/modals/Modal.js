// @flow
import * as React from 'react'
import cx from 'classnames'
import Overlay from './Overlay'
import styles from './modals.css'

type ModalProps = {
  /** handler to close the modal (attached to `Overlay` onClick) */
  onCloseClick?: (event: SyntheticEvent<>) => mixed,
  /** modal contents */
  children: React.Node,
  /** classes to apply */
  className?: string,
  /** classes to apply to the contents box */
  contentsClassName?: string,
  /** lightens overlay (alert modal over existing modal)**/
  alertOverlay?: boolean
}

/**
 * Base modal component that fills its nearest `display:relative` ancestor
 * with a dark overlay and displays `children` as its contents in a white box
 */
export default function Modal (props: ModalProps) {
  const {contentsClassName, alertOverlay, onCloseClick} = props
  return (
    <div className={cx(styles.modal, props.className, {[styles.alert_modal]: alertOverlay})} >
      <Overlay onClick={onCloseClick} alertOverlay={alertOverlay}/>
       <div className={cx(styles.modal_contents, contentsClassName)}>
        {props.children}
      </div>
    </div>
  )
}
