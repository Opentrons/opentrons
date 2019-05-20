// @flow
// full-width labware details
import * as React from 'react'

import { getUniqueWellProperties } from '../../definitions'
import { WellCount, WellProperties, ManufacturerStats } from '../labware-ui'
import { DetailsBox } from '../ui'
import { LabwareGallery, Tags, LoadName } from '../LabwareList'
import LabwareTitle from './LabwareTitle'
import Dimensions from './Dimensions'
import WellDimensions from './WellDimensions'
import WellSpacing from './WellSpacing'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareDetailsProps = {
  definition: LabwareDefinition,
}

export default function LabwareDetails(props: LabwareDetailsProps) {
  const { definition } = props
  const { parameters, metadata } = definition
  const { displayCategory, displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  console.log(definition)
  // TODO(mc, 2019-05-20): clarify this logic with UX. If this logic is
  // correct, this will require additional checks for aluminum blocks once
  // that's a thing and data is in place
  const hasTubes = displayCategory === 'tubeRack'

  return (
    <>
      <LabwareTitle
        definition={definition}
        className={styles.title_container}
      />
      <div className={styles.gallery_container}>
        <LabwareGallery definition={definition} />
        <div className={styles.tags_container}>
          <Tags definition={definition} />
        </div>
        <LoadName loadName={parameters.loadName} />
      </div>
      <div className={styles.details_box_container}>
        <DetailsBox aside={<ManufacturerStats definition={definition} />}>
          <div className={styles.details_container}>
            <WellCount definition={definition} />
            {!hasTubes &&
              wellGroups.map((wellProps, i) => (
                <WellProperties
                  key={i}
                  wellProperties={wellProps}
                  displayVolumeUnits={displayVolumeUnits}
                />
              ))}
            <Dimensions
              definition={definition}
              className={styles.details_table}
            />
            {wellGroups.map((wellProps, i) => (
              <React.Fragment key={i}>
                {!hasTubes && (
                  <WellDimensions
                    wellProperties={wellProps}
                    displayCategory={displayCategory}
                    className={styles.details_table}
                  />
                )}
                <WellSpacing
                  wellProperties={wellProps}
                  displayCategory={displayCategory}
                  className={styles.details_table}
                />
              </React.Fragment>
            ))}
          </div>
        </DetailsBox>
        {hasTubes &&
          wellGroups.map((wellProps, i) => (
            <DetailsBox
              key={i}
              aside={<ManufacturerStats definition={definition} />}
            >
              <div className={styles.details_container}>
                <WellProperties
                  wellProperties={wellProps}
                  displayVolumeUnits={displayVolumeUnits}
                />
                <WellDimensions
                  wellProperties={wellProps}
                  displayCategory={displayCategory}
                  className={styles.details_table}
                />
              </div>
            </DetailsBox>
          ))}
      </div>
    </>
  )
}
