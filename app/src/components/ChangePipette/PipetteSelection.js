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
  let pipetteOptions
  if (props.__pipettePlusEnabled) {
    pipetteOptions = OPTIONS
  } else {
    pipetteOptions = filter(OPTIONS, function(pipette) {
      return !pipette.name.includes('GEN2')
    })
  }

  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect {...props} />
    </label>
  )
}
