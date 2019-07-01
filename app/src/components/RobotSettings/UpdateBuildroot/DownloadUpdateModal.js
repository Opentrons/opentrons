// @flow
// Placeholder modal for missing/downloading/errored update files

import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import styles from './styles.css'

type Props = {
  ignoreUpdate: () => mixed,
}

const HEADING = 'Robot System Update in Progress'
export default function DownloadUpdate(props: Props) {
  const { ignoreUpdate } = props
  return (
    <AlertModal
      heading={HEADING}
      buttons={[{ children: 'cancel', onClick: ignoreUpdate }]}
      alertOverlay
      contentsClassName={styles.system_update_modal}
    >
      <h2>screen not implemented</h2>
    </AlertModal>
  )
}
