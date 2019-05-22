// @flow
// full-width labware details
import * as React from 'react'

import { getUniqueWellProperties } from '../../definitions'
import { WellCount, WellProperties, ManufacturerStats } from '../labware-ui'
import { DetailsBox } from '../ui'
import InsertDetails from './InsertDetails'
import Dimensions from './Dimensions'
import WellDimensions from './WellDimensions'
import WellSpacing from './WellSpacing'

import { SPACING, MEASUREMENTS } from '../../localization'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareDetailsBoxProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export default function LabwareDetailsBox(props: LabwareDetailsBoxProps) {
  const { definition, className } = props
  const { metadata, brand, wells } = definition
  const { displayCategory, displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)

  // TODO(mc, 2019-05-20): clarify this logic with UX. If this logic is
  // correct, this will require additional checks for aluminum blocks once
  // that's a thing and data is in place
  const hasInserts = displayCategory === 'tubeRack'
  const irregular = wellGroups.length > 1

  return (
    <div className={className}>
      <DetailsBox aside={<ManufacturerStats brand={brand} />}>
        <div className={styles.details_container}>
          <WellCount
            displayCategory={displayCategory}
            count={Object.keys(wells).length}
          />
          {!hasInserts && !irregular && (
            <WellProperties
              wellProperties={wellGroups[0]}
              displayVolumeUnits={displayVolumeUnits}
            />
          )}
          <Dimensions
            definition={definition}
            className={styles.details_table}
          />
          {wellGroups.map((wellProps, i) => (
            <React.Fragment key={i}>
              {!hasInserts && irregular && (
                <>
                  <WellCount
                    className={styles.irregular_well_count}
                    displayCategory={displayCategory}
                    count={wellProps.wellCount}
                  />
                  <WellProperties
                    wellProperties={wellProps}
                    displayVolumeUnits={displayVolumeUnits}
                  />
                </>
              )}
              {!hasInserts && (
                <WellDimensions
                  title={`${MEASUREMENTS}${irregular ? ` - Group ${i}` : ''}`}
                  wellProperties={wellProps}
                  className={styles.details_table}
                />
              )}
              <WellSpacing
                title={`${SPACING}${irregular ? ` - Group ${i}` : ''}`}
                wellProperties={wellProps}
                className={styles.details_table}
              />
            </React.Fragment>
          ))}
        </div>
      </DetailsBox>
      {hasInserts && <InsertDetails definition={definition} />}
    </div>
  )
}
