// @flow
import * as React from 'react'

import styles from './modals.css'

type OverlayProps = {
  /** optional onClick handler */
  onClick?: (event: SyntheticEvent<>) => void
}

/**
 * Dark, semi-transparent overlay for the background of a modal. If you need
 * to make a custom modal component, use `<Overlay>`, otherwise you might
 * just want to use `<Modal>`
 */
export default function Overlay (props: OverlayProps) {
  return (
    <div className={styles.overlay} onClick={props.onClick} />
  )
}
