// @flow
// labware display card
// TODO(mc, 2019-03-21): split this file out into multiple component files,
//   many of which will be common to LabwareCard and LabwarePage
import * as React from 'react'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'

import {Icon} from '@opentrons/components'
import {getCategoryLabel} from '../../definitions'
import styles from './styles.css'

import type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareWellProperties,
  LabwareWellMap,
} from '@opentrons/shared-data'

// TODO(mc, 2019-03-18): i18n
const EN_PLATE_DIMS = 'plate dimensions'
const EN_MM = 'mm'
const EN_SHORT_LENGTH = 'l'
const EN_SHORT_WIDTH = 'w'
const EN_SHORT_HEIGHT = 'h'
const EN_LENGTH = 'length'
const EN_WIDTH = 'width'
const EN_DIAMETER = 'diameter'
const EN_DEPTH = 'depth'
const EN_MAX_VOLUME = 'max volume'
const EN_TAGS = 'tags'
const EN_API_NAME = 'api name'

const EN_NUM_WELLS_BY_CATEGORY = {
  wellPlate: 'no. of wells',
  trough: 'no. of wells',
  trash: 'no. of wells',
  other: 'no. of wells',
  tubeRack: 'no. of tubes',
  tipRack: 'no. of tips',
}

const EN_WELL_DIMS_BY_CATEGORY = {
  wellPlate: 'well dimensions',
  trough: 'well dimensions',
  trash: 'well dimensions',
  other: 'well dimensions',
  tubeRack: 'tube dimensions',
  tipRack: 'tip dimensions',
}

export type LabwareCardProps = {definition: LabwareDefinition}

export default function LabwareCard (props: LabwareCardProps) {
  return (
    <div className={styles.card}>
      <TopBar {...props} />
      <Title {...props} />
      <Gallery />
      <div className={styles.stats}>
        <PlateDimensions {...props} />
        <Wells {...props} />
        <WellProperties {...props} />
      </div>
      <Tags {...props} />
      <LoadName {...props} />
    </div>
  )
}

function TopBar (props: LabwareCardProps) {
  const {metadata, brand} = props.definition

  return (
    <p className={styles.top_bar}>
      <span>{brand.brand}</span>
      {' | '}
      <span>{getCategoryLabel(metadata.displayCategory)}</span>
    </p>
  )
}

function Title (props: LabwareCardProps) {
  const {displayName} = props.definition.metadata

  return (
    <h2 className={styles.title}>
      <a className={styles.title_link} href="#">
        {displayName}
        <Icon className={styles.title_icon} name="chevron-right" />
      </a>
    </h2>
  )
}

// TODO(mc, 2019-03-22): unsemantic placeholder; fix up and move to own file
function Gallery () {
  return (
    <div className={styles.gallery}>
      <div className={styles.gallery_main} />
      <div className={styles.thumbnail_row}>
        <div className={styles.thumbnail_container}>
          <div className={styles.thumbnail} />
        </div>
        <div className={styles.thumbnail_container}>
          <div className={styles.thumbnail} />
        </div>
        <div className={styles.thumbnail_container}>
          <div className={styles.thumbnail} />
        </div>
      </div>
    </div>
  )
}

function PlateDimensions (props: LabwareCardProps) {
  const {
    overallLength,
    overallWidth,
    overallHeight,
  } = props.definition.dimensions

  const dimensions = [
    {label: EN_SHORT_LENGTH, value: overallLength},
    {label: EN_SHORT_WIDTH, value: overallWidth},
    {label: EN_SHORT_HEIGHT, value: overallHeight},
  ]

  return (
    <div className={styles.dimensions}>
      <p className={styles.top_label}>
        {EN_PLATE_DIMS} <span className={styles.units}>({EN_MM})</span>
      </p>
      <div className={styles.stats_bar}>
        {dimensions.map((d, i) => (
          <p key={i} className={styles.stats_item}>
            <span className={styles.left_label}>{d.label}</span>
            <span className={styles.value}>{d.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function Wells (props: LabwareCardProps) {
  const {wells, metadata} = props.definition
  const {displayCategory} = metadata

  return (
    <div className={styles.wells}>
      <p className={styles.top_label}>
        {`${EN_NUM_WELLS_BY_CATEGORY[displayCategory]}`}
      </p>
      <p className={styles.value}>{Object.keys(wells).length}</p>
    </div>
  )
}

function WellProperties (props: LabwareCardProps) {
  const {wells, metadata} = props.definition
  // TODO(mc, 2019-03-21): https://github.com/Opentrons/opentrons/issues/3240
  const {displayCategory, displayVolumeUnits} = metadata
  const wellProps = getUniqueWellProperties(wells)

  return (
    <div className={styles.wells}>
      {wellProps.map((w, i) => {
        const dims = [
          {label: EN_DEPTH, value: w.depth},
          w.diameter != null ? {label: EN_DIAMETER, value: w.diameter} : null,
          w.length != null ? {label: EN_LENGTH, value: w.length} : null,
          w.width != null ? {label: EN_WIDTH, value: w.width} : null,
        ].filter(Boolean)

        return (
          <div key={i} className={styles.well_group}>
            <div className={styles.well_dimensions}>
              <p className={styles.top_label}>
                {EN_WELL_DIMS_BY_CATEGORY[displayCategory]}{' '}
                <span className={styles.units}>({EN_MM})</span>
              </p>
              {dims.map((d, j) => (
                <div key={j} className={styles.stats_bar}>
                  <p className={styles.left_label}>{d.label}</p>
                  <p className={styles.value}>{d.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className={styles.well_volume}>
              <p className={styles.top_label}>{EN_MAX_VOLUME}</p>
              <p className={styles.value}>
                {w.totalLiquidVolume} {displayVolumeUnits}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Tags (props: LabwareCardProps) {
  const tags = props.definition.metadata.tags || []

  return (
    <div className={styles.tags}>
      <p className={styles.left_label}>{EN_TAGS}</p>
      <p className={styles.value}>{tags.join(', ')}</p>
    </div>
  )
}

function LoadName (props: LabwareCardProps) {
  const {loadName} = props.definition.parameters

  return (
    <label className={styles.load_name}>
      <p className={styles.top_label}>{EN_API_NAME}</p>
      <input
        className={styles.load_name_input}
        type="text"
        value={loadName}
        onFocus={e => e.currentTarget.select()}
      />
    </label>
  )
}

// TODO(mc, 2019-03-21): move to shared data
function getUniqueWellProperties (
  wells: LabwareWellMap
): Array<LabwareWellProperties> {
  const wellProps = Object.keys(wells).map(k => {
    const {x, y, z, ...props} = wells[k]
    return props
  })

  return uniqWith(wellProps, isEqual)
}
