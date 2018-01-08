import React from 'react'
import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './deck.css'

CalibrationLink.propTypes = {
  to: PropTypes.string.isRequired,
  onClick: PropTypes.func
}

export default function CalibrationLink (props) {
  const style = classnames('btn', styles.btn_calibrate)
  return (
    <Link className={style} to={props.to} onClick={props.onClick} >
      {props.children}
    </Link>
  )
}
