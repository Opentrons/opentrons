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
  return (
    <Button style={classnames('btn', styles.btn_calibrate)} onClick={props.onButtonClick} >
      {props.children}
    </Button>
  )
}
