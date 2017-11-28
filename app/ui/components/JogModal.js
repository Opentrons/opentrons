import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import classnames from 'classnames'

import {constants as robotContants} from '../robot'
import styles from './JogModal.css'
import {Spinner} from './icons'

const {
  JOG_DIRECTION_NEG,
  JOG_DIRECTION_POS,
  JOG_DISTANCE_SLOW_MM,
  JOG_DISTANCE_FAST_MM
} = robotContants

JogModal.propTypes = {
  slot: PropTypes.number.isRequired,
  jogDistance: PropTypes.oneOf([
    JOG_DISTANCE_SLOW_MM,
    JOG_DISTANCE_FAST_MM
  ]).isRequired,
  jog: PropTypes.func.isRequired,
  onConfirmClick: PropTypes.func.isRequired,
  toggleJogDistance: PropTypes.func.isRequired,
  isJogging: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired
}

const BUTTONS = [
  {type: 'left', axis: 'x', direction: JOG_DIRECTION_NEG, arrow: '←'},
  {type: 'right', axis: 'x', direction: JOG_DIRECTION_POS, arrow: '→'},
  {type: 'back', axis: 'y', direction: JOG_DIRECTION_POS, arrow: '↑'},
  {type: 'forward', axis: 'y', direction: JOG_DIRECTION_NEG, arrow: '↓'},
  {type: 'up', axis: 'z', direction: JOG_DIRECTION_POS, arrow: '↑'},
  {type: 'down', axis: 'z', direction: JOG_DIRECTION_NEG, arrow: '↓'}
]

export default function JogModal (props) {
  const {slot, jog, onConfirmClick, isJogging, isUpdating} = props
  const url = `/setup-deck/${slot}`
  const isDisabled = isJogging || isUpdating
  const confirmButtonContents = isUpdating
    ? (<Spinner className={styles.spinner} />)
    : 'Confirm Position'

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.jog_modal}>
        <p>Using the arrow buttons, jog the pipette along the x, y and z
        axis to improve accuracy. Press confirm position to save.
        </p>
        <JogToggle {...props} />
        <div className={styles.jog_controls}>
          {BUTTONS.map((button) => (
            <JogButton
              key={button.type}
              isDisabled={isDisabled}
              jog={jog}
              {...button}
            />
          ))}
          <label className={styles.jog_xy}>X-Y Axis</label>
          <label className={styles.jog_z}>Z Axis</label>
        </div>
        <Link to={url} className={styles.close}>X</Link>

        <Link
          className={classnames(styles.btn_confirm, {disabled: isDisabled})}
          to={`/setup-deck/${slot}`}
          onClick={onConfirmClick}
        >
          {confirmButtonContents}
        </Link>
      </div>
    </div>
  )
}

function JogButton (props) {
  const {type, axis, direction, arrow, isDisabled, jog} = props

  return (
    <button
      className={styles[`btn_${type}`]}
      disabled={isDisabled}
      onClick={jog(axis, direction)}
    >
      {arrow}
    </button>
  )
}

function JogToggle (props) {
  const {jogDistance, toggleJogDistance} = props
  const checked = jogDistance === JOG_DISTANCE_FAST_MM
  const slowStyle = classnames(styles.jog_toggle_setting, {
    [styles.active_toggle]: !checked
  })
  const fastStyle = classnames(styles.jog_toggle_setting, {
    [styles.active_toggle]: checked
  })

  return (
    <div>
      <p className={styles.jog_toggle_title}>
        Jog speed
      </p>
      <label title='Toggle fast jog' className={styles.jog_toggle}>
        <span className={slowStyle}>
          slow
        </span>
        <span className={fastStyle}>
          fast
        </span>
        <input type='checkbox' checked={checked} onChange={toggleJogDistance} />
      </label>
    </div>
  )
}
