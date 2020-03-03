// @flow
import * as React from 'react'
import cx from 'classnames'

import styles from './modals.css'

export type OverlayProps = {|
  /** optional onClick handler */
  onClick?: (event: SyntheticEvent<>) => mixed,
  alertOverlay?: ?boolean,
|}

/**
 * Dark, semi-transparent overlay for the background of a modal. If you need
 * to make a custom modal component, use `<Overlay>`, otherwise you might
 * just want to use `<Modal>`
 */
export function Overlay(props: OverlayProps) {
  const { alertOverlay, onClick } = props

  const className = cx(styles.overlay, {
    [styles.clickable]: onClick,
    [styles.alert_modal_overlay]: alertOverlay,
  })

  return <div className={className} onClick={onClick} />
}
