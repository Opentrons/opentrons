// @flow
import * as React from 'react'
import {
  Pill,
  swatchColors,
  MIXED_WELL_COLOR,
  type HoverTooltipHandlers,
} from '@opentrons/components'
import styles from './StepItem.css'
import type {
  WellIngredientVolumeData,
  WellIngredientNames,
} from '../../steplist'

type Props = {
  ingreds: WellIngredientVolumeData,
  ingredNames: WellIngredientNames,
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
}

export function IngredPill(props: Props) {
  const { ingreds, ingredNames, hoverTooltipHandlers } = props
  if (!ingreds || Object.keys(ingreds).length === 0) {
    // Invisible Pill, but has correct height/margin/etc for spacing
    return <Pill />
  }

  const color =
    Object.keys(ingreds).length === 1
      ? swatchColors(Number(Object.keys(ingreds)[0]))
      : MIXED_WELL_COLOR

  return (
    <Pill
      color={color}
      className={styles.ingred_pill}
      hoverTooltipHandlers={hoverTooltipHandlers}
    >
      {Object.keys(ingreds)
        .map(groupId => ingredNames[groupId])
        .join(',')}
    </Pill>
  )
}
