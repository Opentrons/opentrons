// @flow
// full-width labware details
import * as React from 'react'

import { LabwareGallery, Tags, LoadName } from '../LabwareList'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareDetailsProps = {
  definition: LabwareDefinition,
}

export default function LabwareDetails(props: LabwareDetailsProps) {
  const { definition } = props
  const { parameters, metadata } = definition

  return (
    <>
      <div className={styles.gallery_container}>
        <LabwareGallery definition={definition} />
        <div className={styles.tags_container}>
          <Tags definition={definition} />
        </div>
        <LoadName loadName={parameters.loadName} />
      </div>
      <div className={styles.details_container}>
        <Title>{metadata.displayName}</Title>
      </div>
    </>
  )
}

function Title(props: { children: React.Node }) {
  return <h2 className={styles.title}>{props.children}</h2>
}
