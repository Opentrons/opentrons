// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import styles from './styles.css'

export type ScanButtonProps = {|
  isScanning: boolean,
  onScanClick: () => mixed,
  found: boolean,
|}

export function ScanButton(props: ScanButtonProps): React.Node {
  const { isScanning, onScanClick, found } = props
  const { t } = useTranslation()

  return isScanning ? (
    <Icon name="ot-spinner" className={styles.scan_progress} spin />
  ) : (
    <PrimaryButton onClick={onScanClick} className={styles.scan_button}>
      {found ? t('button.refresh_list') : t('button.try_again')}
    </PrimaryButton>
  )
}
