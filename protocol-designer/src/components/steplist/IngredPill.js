// @flow
import {
  type UseHoverTooltipResult,
  MIXED_WELL_COLOR,
  Pill,
  swatchColors,
} from '@opentrons/components'
import * as React from 'react'

import type {
  WellIngredientNames,
  WellIngredientVolumeData,
} from '../../steplist'
import styles from './StepItem.css'

type Props = {
  ingreds: WellIngredientVolumeData,
  ingredNames: WellIngredientNames,
  targetProps?: ?$ElementType<UseHoverTooltipResult, 0>,
}

export function IngredPill(props: Props): React.Node {
  const { ingreds, ingredNames, targetProps } = props
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
      hoverTooltipHandlers={targetProps}
    >
      {Object.keys(ingreds)
        .map(groupId => ingredNames[groupId])
        .join(',')}
    </Pill>
  )
}
