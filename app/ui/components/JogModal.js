import React from 'react'
import {Link} from 'react-router-dom'
import styles from './JogModal.css'

export default function JogModal (props) {
  const {currentLabware} = props
  const url = `/setup-deck/${currentLabware.slot}`
  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <div className={styles.jog_controls}>

          <button
            className={styles.btn_x_neg}
            onClick={() => console.log ('jog x neg')}
          >
            &#8592;
          </button>

          <button
            className={styles.btn_x_pos}
            onClick={() => console.log ('jog x neg')}
          >
            &#8594;
          </button>

          <button className={styles.btn_y_neg}>&#8593;</button>
          <button className={styles.btn_y_pos}>&#8595;</button>

          <button className={styles.btn_z_neg}>&#8593;</button>
          <button className={styles.btn_z_pos}>&#8595;</button>

        </div>
        <Link to={url} className={styles.close}>X</Link>
        <button className={styles.btn_confirm}>Confirm Position</button>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
      </div>
    </div>
  )
}
