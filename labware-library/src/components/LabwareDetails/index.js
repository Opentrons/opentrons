// @flow
// full-width labware details
import * as React from 'react'

import { LabwareGallery, Tags, LoadName } from '../LabwareList'

import LabwareTitle from './LabwareTitle'
import Stats from './Stats'
import Dimensions from './Dimensions'
import WellDimensions from './WellDimensions'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareDetailsProps = {
  definition: LabwareDefinition,
}

export default function LabwareDetails(props: LabwareDetailsProps) {
  const { definition } = props
  const { parameters } = definition

  return (
    <>
      <LabwareTitle definition={definition} />
      <div className={styles.gallery_container}>
        <LabwareGallery definition={definition} />
        <div className={styles.tags_container}>
          <Tags definition={definition} />
        </div>
        <LoadName loadName={parameters.loadName} />
      </div>
      <div className={styles.details_container}>
        <Stats definition={definition} />
        <Dimensions definition={definition} />
        <WellDimensions definition={definition} />
      </div>
    </>
  )
}
