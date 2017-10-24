import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

import styles from './JogModal.css'

JogModal.propTypes = {
  labware: PropTypes.shape({
    slot: PropTypes.number.isRequired
  }),
  jog: PropTypes.func.isRequired,
  updateOffset: PropTypes.func.isRequired
}

export default function JogModal (props) {
  const {labware, jog, updateOffset} = props
  const url = `/setup-deck`

  if (!labware) return null

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <div className={styles.jog_controls}>
          <button className={styles.btn_x_neg} onClick={jog('x', -1)}>
            &#8592;
          </button>
          <button className={styles.btn_x_pos} onClick={jog('x', 1)}>
            &#8594;
          </button>
          <button className={styles.btn_y_neg} onClick={jog('y', -1)}>
            &#8593;
          </button>
          <button className={styles.btn_y_pos} onClick={jog('y', 1)}>
            &#8595;
          </button>
          <button className={styles.btn_z_neg} onClick={jog('z', -1)}>
            &#8593;
          </button>
          <button className={styles.btn_z_pos} onClick={jog('z', 1)}>
            &#8595;
          </button>
        </div>
        <Link to={url} className={styles.close}>X</Link>
        <button className={styles.btn_confirm} onClick={updateOffset(labware.slot)}>
          Confirm Position
        </button>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
      </div>
    </div>
  )
}
