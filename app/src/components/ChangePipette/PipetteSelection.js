// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { PipetteSelect } from '@opentrons/components'
import { getConfig } from '../../config'
import styles from './styles.css'

const LABEL = 'Select the pipette you wish to attach:'

export type PipetteSelectionProps = {
  ...React.ElementProps<typeof PipetteSelect>,
}

export function PipetteSelection(props: PipetteSelectionProps) {
  const config = useSelector(getConfig)
  const nameBlacklist = Boolean(config.devInternal?.enableMultiGEN2)
    ? []
    : ['p20_multi_gen2', 'p300_multi_gen2']
  return (
    <label className={styles.pipette_selection}>
      <span className={styles.pipette_selection_label}>{LABEL}</span>
      <PipetteSelect
        pipetteName={props.pipetteName}
        onPipetteChange={props.onPipetteChange}
        nameBlacklist={nameBlacklist}
      />
    </label>
  )
}
