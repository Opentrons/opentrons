import React from 'react'
import Button from '../Button'
import Icon, {REFRESH} from '../Icon'
import styles from './connect-panel.css'

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
