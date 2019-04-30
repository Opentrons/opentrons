// @flow
import * as React from 'react'

import { getAllPipetteNames, getPipetteNameSpecs } from '@opentrons/shared-data'
import { DropdownField } from '@opentrons/components'
import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = {
  onChange: $PropertyType<React.ElementProps<typeof DropdownField>, 'onChange'>,
}

const OPTIONS = getAllPipetteNames().map(name => ({
  name: getPipetteNameSpecs(name)?.displayName || name,
  value: name,
}))

export default function PipetteSelection(props: PipetteSelectionProps) {
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <DropdownField {...props} options={OPTIONS} />
    </label>
  )
}
