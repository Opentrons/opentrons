import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

import styles from './JogModal.css'
import {Spinner} from './icons'

JogModal.propTypes = {
  jog: PropTypes.func.isRequired,
  updateOffset: PropTypes.func.isRequired,
  isJogging: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired
}

export default function JogModal (props) {
  const {slot, jog, updateOffset, isJogging, isUpdating} = props
  const url = `/setup-deck/${slot}`
  const isDisabled = isJogging || isUpdating
  const confirmButtonContents = isUpdating
    ? (<Spinner className={styles.spinner} />)
    : 'Confirm Position'

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <div className={styles.jog_controls}>
          <button
            className={styles.btn_left}
            disabled={isDisabled}
            onClick={jog('x', -1)}
          >
            ←
          </button>
          <button
            className={styles.btn_right}
            disabled={isDisabled}
            onClick={jog('x', 1)}>
            →
          </button>
          <button
            className={styles.btn_back}
            disabled={isDisabled}
            onClick={jog('y', 1)}
          >
            ↑
          </button>
          <button
            className={styles.btn_forward}
            disabled={isDisabled}
            onClick={jog('y', -1)}
          >
            ↓
          </button>
          <button
            className={styles.btn_up}
            disabled={isDisabled}
            onClick={jog('z', 1)}
          >
            ↑
          </button>
          <button
            className={styles.btn_down}
            disabled={isDisabled}
            onClick={jog('z', -1)}
          >
            ↓
          </button>
        </div>
        <Link to={url} className={styles.close}>X</Link>
        <button
          className={styles.btn_confirm}
          disabled={isDisabled}
          onClick={updateOffset}
        >
          {confirmButtonContents}
        </button>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
      </div>
    </div>
  )
}
