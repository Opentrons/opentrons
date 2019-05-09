// @flow
import * as React from 'react'
import SingleLabware from '../../SingleLabware'
import styles from './FilePipettesModal.css'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

type Props = { definition?: ?LabwareDefinition2 }

// TODO: Ian 2019-05-08 actually pass a definition down where TiprackDiagram is used! #3334
export default function TiprackDiagram(props: Props) {
  const { definition } = props
  if (!definition) {
    return <div className={styles.tiprack_labware} />
  }

  return (
    <div className={styles.tiprack_labware}>
      <SingleLabware definition={definition} />
    </div>
  )
}
