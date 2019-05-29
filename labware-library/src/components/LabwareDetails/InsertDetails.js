// @flow
// full-width labware details
import * as React from 'react'

import { getUniqueWellProperties } from '../../definitions'
import { WellProperties, ManufacturerStats } from '../labware-ui'
import { DetailsBox } from '../ui'
import WellDimensions from './WellDimensions'

import { MEASUREMENTS } from '../../localization'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type InsertDetailsProps = {|
  definition: LabwareDefinition,
|}

export default function InsertDetails(props: InsertDetailsProps) {
  const { definition } = props
  const { metadata } = definition
  const { displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)

  return (
    <>
      {wellGroups.map((wellProps, i) => (
        <DetailsBox
          key={i}
          aside={
            wellProps.brand ? (
              <ManufacturerStats brand={wellProps.brand} />
            ) : null
          }
        >
          <div className={styles.details_container}>
            {wellProps.metadata.displayName && (
              <h3 className={styles.well_group_title}>
                {wellProps.metadata.displayName}
              </h3>
            )}
            <WellProperties
              wellProperties={wellProps}
              displayVolumeUnits={displayVolumeUnits}
              hideTitle
            />
            <WellDimensions
              title={MEASUREMENTS}
              wellProperties={wellProps}
              className={styles.details_table}
            />
          </div>
        </DetailsBox>
      ))}
    </>
  )
}
