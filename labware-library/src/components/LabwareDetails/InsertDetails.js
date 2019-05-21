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
          aside={<ManufacturerStats brand={{ brand: `Brand ${i}` }} />}
        >
          <div className={styles.details_container}>
            <h3 className={styles.well_group_title}>Group {i}</h3>
            <WellProperties
              wellProperties={wellProps}
              displayVolumeUnits={displayVolumeUnits}
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
