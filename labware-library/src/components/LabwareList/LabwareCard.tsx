// labware display card
import * as React from 'react'
import uniq from 'lodash/uniq'
import { Icon } from '@opentrons/components'
import { getPublicPath } from '../../public-path'
import { isNewLabware } from '../../definitions'
import { Link } from '../ui'
import {
  getWellLabel,
  Gallery,
  LoadName,
  Tags,
  WellCount,
  AllWellProperties,
  NewLabwareAlert,
} from '../labware-ui'
import {
  CATEGORY_LABELS_BY_CATEGORY,
  MANUFACTURER_VALUES,
} from '../../localization'
import type { LabwareDefinition } from '../../types'

import styles from './styles.module.css'
export interface LabwareCardProps {
  definition: LabwareDefinition
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { definition } = props
  const wellLabel = getWellLabel(definition)

  return (
    <li className={styles.card}>
      <TopBar {...props} />
      <Title {...props} />
      <div className={styles.card_contents}>
        <Gallery definition={definition} className={styles.gallery_container} />
        <div className={styles.stats}>
          <WellCount
            wellLabel={wellLabel}
            count={Object.keys(definition.wells).length}
            className={styles.well_count}
          />
          <AllWellProperties
            definition={definition}
            className={styles.well_properties}
          />
        </div>
      </div>
      <Tags definition={definition} />
      {isNewLabware(definition) && <NewLabwareAlert />}
      <LoadName loadName={definition.parameters.loadName} />
    </li>
  )
}

function TopBar(props: LabwareCardProps): JSX.Element {
  const { metadata, brand, groups } = props.definition
  const groupBrands = groups.map(group => group.brand?.brand).filter(Boolean)

  const brands = uniq([brand.brand, ...groupBrands])
    // @ts-expect-error(IL, 2021-03-24): groupBrands filtering nulls, and MANUFACTURER_VALUES lookup not understood by TS
    .map(b => MANUFACTURER_VALUES[b] || b)
    .join(', ')

  return (
    <p className={styles.top_bar}>
      <span>{brands}</span>
      {' | '}
      <span>{CATEGORY_LABELS_BY_CATEGORY[metadata.displayCategory]}</span>
    </p>
  )
}

function Title(props: LabwareCardProps): JSX.Element {
  const { loadName } = props.definition.parameters
  const { displayName } = props.definition.metadata

  return (
    <Link to={`${getPublicPath()}${loadName}`}>
      <h2 className={styles.title}>
        <span className={styles.title_text}>{displayName}</span>
        <Icon className={styles.title_icon} name="chevron-right" />
      </h2>
    </Link>
  )
}
