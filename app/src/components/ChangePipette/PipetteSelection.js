// @flow
import * as React from 'react'

import { PipetteSelect } from '@opentrons/components'
import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = {
  ...React.ElementProps<typeof PipetteSelect>,
}

export default function PipetteSelection(props: PipetteSelectionProps) {
  const nameBlacklist = ['p20_multi_gen2', 'p300_multi_gen2']
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect
        value={props.value}
        onPipetteChange={props.onPipetteChange}
        nameBlacklist={nameBlacklist}
      />
    </label>
  )
}
