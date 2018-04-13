// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'

import TitledModal from './TitledModal'
import styles from './styles.css'

type Props = {
  title: string,
  subtitle: string,
  onBackClick: () => mixed,
  message: string
}

// TODO (ka 2018-4-10): move this component to util/ or at least up a level for reuse for tip probe
export default function RequestInProgressModal (props: Props) {
  return (
    <TitledModal
      contentsClassName={styles.in_progress_contents}
      title={props.title}
      subtitle={props.subtitle}
      onBackClick={props.onBackClick}
      backClickDisabled
    >
      <Icon name='ot-spinner' spin className={styles.in_progress_icon} />
      <p>{props.message}</p>
    </TitledModal>
  )
}
