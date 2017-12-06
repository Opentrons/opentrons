import React from 'react'
import PropTypes from 'prop-types'
import Button from '../Button'
import Icon, {REFRESH} from '../Icon'

import styles from './connect-panel.css'

ScanButton.propTypes = {
  onScanClick: PropTypes.func.isRequired,
  titleBtn: PropTypes.bool
}

export default function ScanButton (props) {
  const {onScanClick, titleBtn} = props
  const style = titleBtn
    ? styles.title_button
    : styles.scan_button

  return (
    <Button
      style={style}
      onClick={onScanClick}
      title='Scan for robots'
    >
      <Icon name={REFRESH} className={styles.refresh} />
    </Button>
  )
}
