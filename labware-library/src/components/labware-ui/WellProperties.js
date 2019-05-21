// @flow
import * as React from 'react'

import { getDisplayVolume } from '@opentrons/shared-data'
import { getUniqueWellProperties } from '../../definitions'
import { MAX_VOLUME } from '../../localization'
import { LabelText, Value, LABEL_TOP } from '../ui'

import styles from './styles.css'

import type {
  LabwareDefinition,
  LabwareWellGroupProperties,
  LabwareVolumeUnits,
} from '../../types'

export type AllWellPropertiesProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export type WellPropertiesProps = {|
  wellProperties: LabwareWellGroupProperties,
  displayVolumeUnits: LabwareVolumeUnits,
|}

export function AllWellProperties(props: AllWellPropertiesProps) {
  const { definition, className } = props
  const { displayVolumeUnits } = definition.metadata
  const uniqueWellProps = getUniqueWellProperties(definition)

  return (
    <div className={className}>
      {uniqueWellProps.map((wellProperties, i) => (
        <WellProperties
          key={i}
          wellProperties={wellProperties}
          displayVolumeUnits={displayVolumeUnits}
        />
      ))}
    </div>
  )
}

export function WellProperties(props: WellPropertiesProps) {
  const { wellProperties, displayVolumeUnits } = props

  const vol = getDisplayVolume(
    wellProperties.totalLiquidVolume,
    displayVolumeUnits,
    2
  )

  return (
    <div className={styles.well_properties}>
      <LabelText position={LABEL_TOP}>{MAX_VOLUME}</LabelText>
      <Value>
        {vol} {displayVolumeUnits}
      </Value>
    </div>
  )
}
