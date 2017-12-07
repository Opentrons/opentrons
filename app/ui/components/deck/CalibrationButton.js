import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from '../Button'
import styles from './deck.css'

CalibrationButton.propTypes = {
  style: PropTypes.string,
  onClick: PropTypes.func
}

export default function CalibrationButton (props) {
  const style = classnames('btn', styles.btn_calibrate)

  return (
    <Button style={style} onClick={props.onClick} >
      {props.children}
    </Button>
  )
}
