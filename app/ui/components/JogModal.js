import React from 'react'
import {NavLink} from 'react-router-dom'
import styles from './JogModal.css'

export default function JogModal (props) {
  const {currentLabware} = props
  const url = `/setup-deck/${currentLabware.slot}`
  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <div className={styles.jog_controls} />
        <NavLink to={url} className={styles.close}>X</NavLink>
        <button className={styles.btn_confirm}>Confirm Position</button>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
      </div>
    </div>
  )
}
