// @flow
import { PipetteSelect } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = {
  ...React.ElementProps<typeof PipetteSelect>,
}

export function PipetteSelection(props: PipetteSelectionProps): React.Node {
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect
        pipetteName={props.pipetteName}
        onPipetteChange={props.onPipetteChange}
      />
    </label>
  )
}
