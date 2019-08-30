// @flow
import * as React from 'react'
import filter from 'lodash/filter'

import { getAllPipetteNames, getPipetteNameSpecs } from '@opentrons/shared-data'
import { PipetteSelect } from '@opentrons/components'
import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = {
  onChange: $PropertyType<React.ElementProps<typeof DropdownField>, 'onChange'>,
  __pipettePlusEnabled: boolean,
}

const OPTIONS = getAllPipetteNames().map(name => ({
  name: getPipetteNameSpecs(name)?.displayName || name,
  value: name,
}))

export default function PipetteSelection(props: PipetteSelectionProps) {
  let nameBlacklist = []
  if (!props.__pipettePlusEnabled) {
    nameBlacklist = [
      'p20_multi_gen2',
      'p20_single_gen2',
      'p300_multi_gen2',
      'p300_single_gen2',
      'p1000_single_gen2',
    ]
  }
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect {...props} nameBlacklist={nameBlacklist} />
    </label>
  )
}
