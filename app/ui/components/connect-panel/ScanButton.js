import React from 'react'
import classnames from 'classnames'
import Button from '../Button'
import Icon, {REFRESH} from '../Icon'
import styles from './connect-panel.css'

export default function ScanButton (props) {
  const {onScanClick, titleBtn} = props
  const style = titleBtn
  ? classnames(styles.scan_button, styles.title_button)
  : styles.scan_button

  return (
    <Button
      style={classnames(styles.scan_button, style)}
      onClick={onScanClick}
      title='Scan for robots'
    >
      <Icon name={REFRESH} className={styles.refresh} />
    </Button>
  )
}
