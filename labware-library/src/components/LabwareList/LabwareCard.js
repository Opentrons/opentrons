// @flow
// labware display card
// TODO(mc, 2019-03-21): split this file out into multiple component files,
//   many of which will be common to LabwareCard and LabwarePage
import * as React from 'react'
import { Link } from 'react-router-dom'
import round from 'lodash/round'

import { getDisplayVolume } from '@opentrons/shared-data'
import { getPublicPath } from '../../public-path'
import { getUniqueWellProperties } from '../../definitions'
import { Icon } from '@opentrons/components'
import Gallery from './LabwareGallery'
import LoadName from './LoadName'
import Tags from './Tags'
import styles from './styles.css'

import {
  LabeledValueTable,
  LabelText,
  Value,
  TABLE_ROW,
  LABEL_TOP,
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

import type { LabwareDefinition } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

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
        <Dimensions {...props} />
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

function Dimensions(props: LabwareCardProps) {
  const { definition } = props
  const { displayCategory } = definition.metadata
  const { xDimension, yDimension, zDimension } = definition.dimensions
  const dimsLabel =
    LABWARE_DIMS_BY_CATEGORY[displayCategory] || LABWARE_DIMS_BY_CATEGORY.other

  const dimensions = [
    { label: SHORT_X_DIM, value: toFixed(xDimension) },
    { label: SHORT_Y_DIM, value: toFixed(yDimension) },
    { label: SHORT_Z_DIM, value: toFixed(zDimension) },
  ]

  return (
    <LabeledValueTable
      className={styles.dimensions}
      direction={TABLE_ROW}
      label={
        <>
          {dimsLabel} <span className={styles.units}>({MM})</span>
        </>
      }
      values={dimensions}
    />
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
  const { definition } = props
  const { displayCategory, displayVolumeUnits } = definition.metadata
  const wellProps = getUniqueWellProperties(definition)
  const wellDimsLabel =
    WELL_DIMS_BY_CATEGORY[displayCategory] || WELL_DIMS_BY_CATEGORY.other

  return (
    <div className={styles.wells}>
      {wellProps.map((w, i) => {
        const vol = getDisplayVolume(w.totalLiquidVolume, displayVolumeUnits, 2)
        const dims = [
          { label: DEPTH, value: toFixed(w.depth) },
          w.diameter != null
            ? { label: DIAMETER, value: toFixed(w.diameter) }
            : null,
          w.xDimension != null
            ? { label: X_DIM, value: toFixed(w.xDimension) }
            : null,
          w.yDimension != null
            ? { label: Y_DIM, value: toFixed(w.yDimension) }
            : null,
        ].filter(Boolean)

        return (
          <div key={i} className={styles.well_group}>
            <LabeledValueTable
              className={styles.well_dimensions}
              label={
                <>
                  {wellDimsLabel} <span className={styles.units}>({MM})</span>
                </>
              }
              values={dims}
            />
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
