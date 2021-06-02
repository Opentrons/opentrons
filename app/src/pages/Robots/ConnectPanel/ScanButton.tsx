import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import styles from './styles.css'

export interface ScanButtonProps {
  isScanning: boolean
  onScanClick: () => unknown
  found: boolean
}

export function ScanButton(props: ScanButtonProps): JSX.Element {
  const { isScanning, onScanClick, found } = props
  const { t } = useTranslation()

  return isScanning ? (
    <Icon name="ot-spinner" className={styles.scan_progress} spin />
  ) : (
    <PrimaryButton onClick={onScanClick} className={styles.scan_button}>
      {found ? t('refresh_list') : t('try_again')}
    </PrimaryButton>
  )
}
