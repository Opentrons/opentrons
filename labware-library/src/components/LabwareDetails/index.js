// @flow
// full-width labware details
import * as React from 'react'

import { Gallery, Tags, LoadName } from '../labware-ui'
import type { LabwareDefinition } from '../../types'
import { LabwareTitle } from './LabwareTitle'
import { LabwareDetailsBox } from './LabwareDetailsBox'
import styles from './styles.css'

export type LabwareDetailsProps = {|
  definition: LabwareDefinition,
|}

export function LabwareDetails(props: LabwareDetailsProps): React.Node {
  const { definition } = props
  const { loadName } = definition.parameters

  return (
    <>
      <LabwareTitle
        definition={definition}
        className={styles.title_container}
      />
      <div className={styles.gallery_container}>
        <Gallery definition={definition} />
        <Tags definition={definition} className={styles.tags_container} />
        <LoadName loadName={loadName} />
      </div>
      <LabwareDetailsBox
        definition={definition}
        className={styles.details_box_container}
      />
    </>
  )
}
