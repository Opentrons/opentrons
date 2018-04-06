// @flow
import * as React from 'react'

import {DropdownField} from '@opentrons/components'
import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = React.ElementProps<typeof DropdownField>

export default function PipetteSelection (props: PipetteSelectionProps) {
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>
        {LABEL}
      </span>
      <DropdownField {...props} />
    </label>
  )
}
