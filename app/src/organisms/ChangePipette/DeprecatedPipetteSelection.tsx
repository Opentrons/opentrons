import * as React from 'react'

import { PipetteSelect } from '@opentrons/components'
import styles from './styles.css'
import { OT3_PIPETTES } from '@opentrons/shared-data'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = React.ComponentProps<typeof PipetteSelect>

/**
 * @deprecated use PipetteSelection instead
 */
export function DeprecatedPipetteSelection(
  props: PipetteSelectionProps
): JSX.Element {
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect
        pipetteName={props.pipetteName}
        onPipetteChange={props.onPipetteChange}
        nameBlocklist={OT3_PIPETTES}
      />
    </label>
  )
}
