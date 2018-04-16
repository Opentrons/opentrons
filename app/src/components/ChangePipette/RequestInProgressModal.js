// @flow
import * as React from 'react'

import type {ChangePipetteProps} from './types'
import {Icon} from '@opentrons/components'
import TitledModal from './TitledModal'
import styles from './styles.css'

// TODO (ka 2018-4-10): move this component to util/ or at least up a level for reuse for tip probe
export default function RequestInProgressModal (props: ChangePipetteProps) {
  const message = props.mount === 'right'
    ? 'Right pipette carriage moving to front and left.'
    : 'Left pipette carriage moving to front and right.'

  return (
    <TitledModal
      contentsClassName={styles.in_progress_contents}
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        button: {disabled: true}
      }}
    >
      <Icon name='ot-spinner' spin className={styles.in_progress_icon} />
      <p>
        {message}
      </p>
    </TitledModal>
  )
}
