// @flow
// full-width labware details
import * as React from 'react'

import { getUniqueWellProperties } from '../../labwareInference'
import { getWellLabel, WellProperties, ManufacturerStats } from '../labware-ui'
import { DetailsBox } from '../ui'
import type { LabwareDefinition } from '../../types'
import { WellDimensions } from './WellDimensions'

import styles from './styles.css'

export type InsertDetailsProps = {|
  definition: LabwareDefinition,
|}

export function InsertDetails(props: InsertDetailsProps): React.Node {
  const { definition } = props
  const { metadata, parameters } = definition
  const { displayVolumeUnits, displayCategory } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  return (
    <>
      {wellGroups.map((wellProps, i) => {
        const wellLabel = getWellLabel(wellProps, definition)

        return (
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
                wellLabel={wellLabel}
                displayVolumeUnits={displayVolumeUnits}
                hideTitle
              />
              <WellDimensions
                category={displayCategory}
                labwareParams={parameters}
                wellProperties={wellProps}
                wellLabel={wellLabel}
                className={styles.details_table}
              />
            </div>
          </DetailsBox>
        )
      })}
    </>
  )
}
