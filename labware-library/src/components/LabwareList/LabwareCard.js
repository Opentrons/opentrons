// @flow
// labware display card
// TODO(mc, 2019-03-21): split this file out into multiple component files,
//   many of which will be common to LabwareCard and LabwarePage
import * as React from 'react'
import { Link } from 'react-router-dom'

import { getPublicPath } from '../../public-path'
import { Icon } from '@opentrons/components'
import {
  Gallery,
  LoadName,
  Tags,
  WellCount,
  AllWellProperties,
} from '../labware-ui'

import { CATEGORY_LABELS_BY_CATEGORY } from '../../localization'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareCardProps = {| definition: LabwareDefinition |}

export default function LabwareCard(props: LabwareCardProps) {
  const { definition } = props
  const { displayCategory } = definition.metadata

  return (
    <li className={styles.card}>
      <TopBar {...props} />
      <Title {...props} />
      <div className={styles.card_contents}>
        <Gallery definition={definition} className={styles.gallery_container} />
        <div className={styles.stats}>
          <WellCount
            count={Object.keys(definition.wells).length}
            displayCategory={displayCategory}
            className={styles.well_count}
          />
          <AllWellProperties
            definition={definition}
            className={styles.well_properties}
          />
        </div>
      </div>
      <Tags definition={definition} />
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
