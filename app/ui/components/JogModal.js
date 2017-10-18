import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

import styles from './JogModal.css'

JogModal.propTypes = {
  jog: PropTypes.func.isRequired,
  updateOffset: PropTypes.func.isRequired
}

export default function JogModal (props) {
  const {jog, updateOffset} = props
  const url = `/setup-deck`

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <div className={styles.jog_controls}>
          <button className={styles.btn_left} onClick={jog('x', -1)}>
            ←
          </button>
          <button className={styles.btn_right} onClick={jog('x', 1)}>
            →
          </button>
          <button className={styles.btn_back} onClick={jog('y', 1)}>
            ↑
          </button>
          <button className={styles.btn_forward} onClick={jog('y', -1)}>
            ↓
          </button>
          <button className={styles.btn_up} onClick={jog('z', 1)}>
            ↑
          </button>
          <button className={styles.btn_down} onClick={jog('z', -1)}>
            ↓
          </button>
        </div>
        <Link to={url} className={styles.close}>X</Link>
        <button className={styles.btn_confirm} onClick={updateOffset}>
          Confirm Position
        </button>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
      </div>
    </div>
  )
}
