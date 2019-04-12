// @flow
// labware display card
// TODO(mc, 2019-03-21): split this file out into multiple component files,
//   many of which will be common to LabwareCard and LabwarePage
import * as React from 'react'
import { Link } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import round from 'lodash/round'
import uniqWith from 'lodash/uniqWith'

import { getDisplayVolume } from '@opentrons/shared-data'
import { getPublicPath } from '../../public-path'
import { Icon } from '@opentrons/components'
import Gallery from './LabwareGallery'
import LoadName from './LoadName'
import Tags from './Tags'
import styles from './styles.css'

import {
  Table,
  TableEntry,
  LabelText,
  Value,
  TABLE_ROW,
  TABLE_COLUMN,
  LABEL_TOP,
  LABEL_LEFT,
} from '../ui'

import {
  CATEGORY_LABELS_BY_CATEGORY,
  NUM_WELLS_SHORT_BY_CATEGORY,
  LABWARE_DIMS_BY_CATEGORY,
  WELL_DIMS_BY_CATEGORY,
  MM,
  SHORT_X_DIM,
  SHORT_Y_DIM,
  SHORT_Z_DIM,
  X_DIM,
  Y_DIM,
  DIAMETER,
  DEPTH,
  MAX_VOLUME,
} from '../../localization'

import type {
  LabwareDefinition,
  LabwareWellProperties,
  LabwareWellMap,
} from '../../types'

// safe toFixed
const toFixed = (n: number, d: number): string => round(n, d).toFixed(d)

export type LabwareCardProps = { definition: LabwareDefinition }

export default function LabwareCard(props: LabwareCardProps) {
  const { definition } = props

  return (
    <li className={styles.card}>
      <TopBar {...props} />
      <Title {...props} />
      <div className={styles.gallery_container}>
        <Gallery {...props} />
      </div>
      <div className={styles.stats}>
        <PlateDimensions {...props} />
        <Wells {...props} />
        <WellProperties {...props} />
      </div>
      <div className={styles.tags_container}>
        <Tags {...props} />
      </div>
      <LoadName loadName={definition.parameters.loadName} />
    </li>
  )
}

function TopBar(props: LabwareCardProps) {
  const { metadata, brand } = props.definition

  return (
    <p className={styles.top_bar}>
      <span>{brand.brand}</span>
      {' | '}
      <span>{CATEGORY_LABELS_BY_CATEGORY[metadata.displayCategory]}</span>
    </p>
  )
}

function Title(props: LabwareCardProps) {
  const { loadName } = props.definition.parameters
  const { displayName } = props.definition.metadata

  return (
    <Link to={`${getPublicPath()}${loadName}`}>
      <h2 className={styles.title}>
        {displayName}
        <Icon className={styles.title_icon} name="chevron-right" />
      </h2>
    </Link>
  )
}

function PlateDimensions(props: LabwareCardProps) {
  const { definition } = props
  const { displayCategory } = definition.metadata
  const { overallLength, overallWidth, overallHeight } = definition.dimensions

  const dimensions = [
    { label: SHORT_X_DIM, value: overallLength },
    { label: SHORT_Y_DIM, value: overallWidth },
    { label: SHORT_Z_DIM, value: overallHeight },
  ]

  return (
    <div className={styles.dimensions}>
      <LabelText position={LABEL_TOP}>
        {LABWARE_DIMS_BY_CATEGORY[displayCategory] ||
          LABWARE_DIMS_BY_CATEGORY.other}{' '}
        <span className={styles.units}>({MM})</span>
      </LabelText>
      <Table direction={TABLE_ROW}>
        {dimensions.map((d, i) => (
          <TableEntry key={i}>
            <LabelText position={LABEL_LEFT}>{d.label}</LabelText>
            <Value>{toFixed(d.value, 2)}</Value>
          </TableEntry>
        ))}
      </Table>
    </div>
  )
}

function Wells(props: LabwareCardProps) {
  const { wells, metadata } = props.definition
  const { displayCategory } = metadata

  return (
    <div className={styles.wells}>
      <LabelText position={LABEL_TOP}>
        {`${NUM_WELLS_SHORT_BY_CATEGORY[displayCategory]}`}
      </LabelText>
      <Value>{Object.keys(wells).length}</Value>
    </div>
  )
}

function WellProperties(props: LabwareCardProps) {
  const { wells, metadata } = props.definition
  const { displayCategory, displayVolumeUnits } = metadata
  const wellProps = getUniqueWellProperties(wells)

  return (
    <div className={styles.wells}>
      {wellProps.map((w, i) => {
        const dims = [
          { label: DEPTH, value: w.depth },
          w.diameter != null ? { label: DIAMETER, value: w.diameter } : null,
          w.length != null ? { label: X_DIM, value: w.length } : null,
          w.width != null ? { label: Y_DIM, value: w.width } : null,
        ].filter(Boolean)
        const vol = getDisplayVolume(w.totalLiquidVolume, displayVolumeUnits, 2)

        return (
          <div key={i} className={styles.well_group}>
            <div className={styles.well_dimensions}>
              <LabelText position={LABEL_TOP}>
                {WELL_DIMS_BY_CATEGORY[displayCategory] ||
                  WELL_DIMS_BY_CATEGORY.other}{' '}
                <span className={styles.units}>({MM})</span>
              </LabelText>
              <Table direction={TABLE_COLUMN}>
                {dims.map((d, j) => (
                  <TableEntry key={j}>
                    <LabelText position={LABEL_LEFT}>{d.label}</LabelText>
                    <Value>{toFixed(d.value, 2)}</Value>
                  </TableEntry>
                ))}
              </Table>
            </div>
            <div className={styles.well_volume}>
              <LabelText position={LABEL_TOP}>{MAX_VOLUME}</LabelText>
              <Value>
                {vol} {displayVolumeUnits}
              </Value>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// TODO(mc, 2019-03-21): move to shared data
function getUniqueWellProperties(
  wells: LabwareWellMap
): Array<LabwareWellProperties> {
  const wellProps = Object.keys(wells).map(k => {
    const { x, y, z, ...props } = wells[k]
    return props
  })

  return uniqWith(wellProps, isEqual)
}
