// @flow
// labware display card
// TODO(mc, 2019-03-21): split this file out into multiple component files,
//   many of which will be common to LabwareCard and LabwarePage
import * as React from 'react'
import { Link } from 'react-router-dom'

import { getDisplayVolume } from '@opentrons/shared-data'
import { getPublicPath } from '../../public-path'
import { getUniqueWellProperties } from '../../definitions'
import { Icon } from '@opentrons/components'
import Gallery from './LabwareGallery'
import LoadName from './LoadName'
import Tags from './Tags'
import styles from './styles.css'

import { LabelText, Value, LABEL_TOP, LABEL_LEFT } from '../ui'

import {
  CATEGORY_LABELS_BY_CATEGORY,
  NUM_WELLS_BY_CATEGORY,
  MAX_VOLUME,
} from '../../localization'

import type { LabwareDefinition } from '../../types'

export type LabwareCardProps = { definition: LabwareDefinition }

export default function LabwareCard(props: LabwareCardProps) {
  const { definition } = props

  return (
    <li className={styles.card}>
      <TopBar {...props} />
      <Title {...props} />
      <div className={styles.card_contents}>
        <div className={styles.gallery_container}>
          <Gallery {...props} />
        </div>
        <div className={styles.stats}>
          <WellCount {...props} />
          <WellProperties {...props} />
        </div>
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

function WellCount(props: LabwareCardProps) {
  const { wells, metadata } = props.definition
  const { displayCategory } = metadata
  const numWellsLabel =
    NUM_WELLS_BY_CATEGORY[displayCategory] || NUM_WELLS_BY_CATEGORY.other

  return (
    <div className={styles.well_count}>
      <LabelText position={LABEL_LEFT}>{numWellsLabel}</LabelText>
      <Value>{Object.keys(wells).length}</Value>
    </div>
  )
}

function WellProperties(props: LabwareCardProps) {
  const { definition } = props
  const { displayVolumeUnits } = definition.metadata
  const wellProps = getUniqueWellProperties(definition)

  return (
    <div className={styles.well_properties}>
      {wellProps.map((w, i) => {
        const vol = getDisplayVolume(w.totalLiquidVolume, displayVolumeUnits, 2)

        return (
          <div key={i} className={styles.well_group_properties}>
            <LabelText position={LABEL_TOP}>{MAX_VOLUME}</LabelText>
            <Value>
              {vol} {displayVolumeUnits}
            </Value>
          </div>
        )
      })}
    </div>
  )
}
