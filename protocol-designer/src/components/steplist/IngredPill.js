// @flow
import * as React from 'react'
import { Pill, type UseHoverTooltipResult } from '@opentrons/components'
import { AIR } from '@opentrons/step-generation'
import { swatchColors, MIXED_WELL_COLOR } from '../swatchColors'
import type {
  WellIngredientVolumeData,
  WellIngredientNames,
} from '../../steplist'
import styles from './StepItem.css'

type Props = {
  ingreds: WellIngredientVolumeData,
  ingredNames: WellIngredientNames,
  targetProps?: ?$ElementType<UseHoverTooltipResult, 0>,
}

export function IngredPill(props: Props): React.Node {
  const { ingredNames, targetProps } = props
  const ingredIds: Array<string> = Object.keys(props.ingreds)

  if (ingredIds.filter(id => id !== AIR).length === 0) {
    // Invisible Pill, but has correct height/margin/etc for spacing
    return <Pill />
  }

  const color =
    ingredIds.length === 1 ? swatchColors(ingredIds[0]) : MIXED_WELL_COLOR

  return (
    <Pill
      color={color}
      className={styles.ingred_pill}
      hoverTooltipHandlers={targetProps}
    >
      {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
    </Pill>
  )
}
