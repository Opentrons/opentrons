// @flow
// full-width labware details
import * as React from 'react'

import { getUniqueWellProperties } from '../../labwareInference'
import type { LabwareDefinition } from '../../types'
import {
  getWellLabel,
  ManufacturerStats,
  WellCount,
  WellProperties,
} from '../labware-ui'
import { DetailsBox } from '../ui'
import { Dimensions } from './Dimensions'
import { InsertDetails } from './InsertDetails'
import styles from './styles.css'
import { WellDimensions } from './WellDimensions'
import { WellSpacing } from './WellSpacing'

export type LabwareDetailsBoxProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function LabwareDetailsBox(props: LabwareDetailsBoxProps): React.Node {
  const { definition, className } = props
  const { metadata, parameters, brand, wells, ordering } = definition
  const { displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  const wellLabel = getWellLabel(definition)
  const hasInserts = wellGroups.some(g => g.metadata.displayCategory)
  const insert = wellGroups.find(g => g.metadata.displayCategory)
  const insertCategory = insert?.metadata.displayCategory
  const irregular = wellGroups.length > 1
  const isMultiRow = ordering.some(row => row.length > 1)

  return (
    <div className={className}>
      <DetailsBox aside={<ManufacturerStats brand={brand} />}>
        <div className={styles.details_container}>
          <WellCount wellLabel={wellLabel} count={Object.keys(wells).length} />
          {!hasInserts && !irregular && (
            <WellProperties
              wellProperties={wellGroups[0]}
              wellLabel={wellLabel}
              displayVolumeUnits={displayVolumeUnits}
              hideTitle
            />
          )}
          <Dimensions
            definition={definition}
            className={styles.details_table}
            irregular={irregular}
            insertCategory={insertCategory}
          />
          {wellGroups.map((wellProps, i) => {
            const { metadata: groupMetadata } = wellProps
            const wellLabel = getWellLabel(wellProps, definition)
            const groupDisplaySuffix = groupMetadata.displayName
              ? ` - ${groupMetadata.displayName}`
              : ''

            return (
              <React.Fragment key={i}>
                {!groupMetadata.displayCategory && irregular && (
                  <>
                    <WellCount
                      count={wellProps.wellCount}
                      wellLabel={wellLabel}
                      className={styles.irregular_well_count}
                    />
                    <WellProperties
                      wellProperties={wellProps}
                      wellLabel={wellLabel}
                      displayVolumeUnits={displayVolumeUnits}
                      hideTitle
                    />
                  </>
                )}
                {!groupMetadata.displayCategory && (
                  <WellDimensions
                    labwareParams={parameters}
                    category={definition.metadata.displayCategory}
                    wellProperties={wellProps}
                    wellLabel={wellLabel}
                    labelSuffix={groupDisplaySuffix}
                    className={styles.details_table}
                  />
                )}
                <WellSpacing
                  category={definition.metadata.displayCategory}
                  wellProperties={wellProps}
                  isMultiRow={isMultiRow}
                  labelSuffix={groupDisplaySuffix}
                  className={styles.details_table}
                />
              </React.Fragment>
            )
          })}
        </div>
      </DetailsBox>
      {hasInserts && <InsertDetails definition={definition} />}
    </div>
  )
}
