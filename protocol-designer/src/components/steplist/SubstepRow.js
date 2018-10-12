// @flow
import * as React from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import omitBy from 'lodash/omitBy'

import {HoverTooltip, swatchColors} from '@opentrons/components'
import type {SubstepWellData, WellIngredientVolumeData, WellIngredientNames} from '../../steplist/types'
import IngredPill from './IngredPill'
import {PDListItem} from '../lists'
import styles from './StepItem.css'
import {formatVolume, formatPercentage} from './utils'

type SubstepRowProps = {|
  volume?: ?number | ?string,
  source?: SubstepWellData,
  dest?: SubstepWellData,
  ingredNames: WellIngredientNames,
  className?: string,
  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed,
|}

type PillTooltipContentsProps = {
  ingreds: WellIngredientVolumeData,
  ingredNames: WellIngredientNames,
  well: string,
}
export const PillTooltipContents = (props: PillTooltipContentsProps) => {
  const totalLiquidVolume = reduce(props.ingreds, (acc, ingred) => acc + ingred.volume, 0)
  const hasMultipleIngreds = Object.keys(props.ingreds).length > 1
  return (
    <div className={styles.liquid_tooltip_contents}>
      <table>
        <tbody>
          {map(props.ingreds, (ingred, groupId) => (
            <tr key={groupId} className={styles.ingred_row}>
              <td>
                <div
                  className={styles.liquid_circle}
                  style={{backgroundColor: swatchColors(Number(groupId))}} />
              </td>
              <td className={styles.ingred_name}>
                {props.ingredNames[groupId]}
              </td>
              {
                hasMultipleIngreds &&
                <td className={styles.ingred_percentage}>{formatPercentage(ingred.volume, totalLiquidVolume)}</td>
              }
              <td className={styles.ingred_partial_volume}>{formatVolume(ingred.volume, 2)}µl</td>
            </tr>
          ))}
        </tbody>
      </table>
      {
        hasMultipleIngreds &&
        <React.Fragment>
          <div className={styles.total_divider}></div>
          <div className={styles.total_row}>
            <span>{`${props.well} Total Volume`}</span>
            <span>{formatVolume(totalLiquidVolume, 2)}µl</span>
          </div>
        </React.Fragment>
      }
    </div>
  )
}

export default function SubstepRow (props: SubstepRowProps) {
  const compactedSourcePreIngreds = props.source ? omitBy(props.source.preIngreds, ingred => ingred.volume <= 0) : {}
  const compactedDestPreIngreds = props.dest ? omitBy(props.dest.preIngreds, ingred => ingred.volume <= 0) : {}
  return (
    <PDListItem
      border
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}>
      <HoverTooltip
        tooltipComponent={(
          <PillTooltipContents
            well={props.source ? props.source.well : ''}
            ingredNames={props.ingredNames}
            ingreds={compactedSourcePreIngreds} />
        )}>
        {(hoverTooltipHandlers) => (
          <IngredPill
            hoverTooltipHandlers={hoverTooltipHandlers}
            ingredNames={props.ingredNames}
            ingreds={compactedSourcePreIngreds} />
        )}
      </HoverTooltip>
      <span className={styles.emphasized_cell}>{props.source && props.source.well}</span>
      <span className={styles.volume_cell}>{`${formatVolume(props.volume)} μL`}</span>
      <span className={styles.emphasized_cell}>{props.dest && props.dest.well}</span>
      <HoverTooltip
        tooltipComponent={(
          <PillTooltipContents
            well={props.dest ? props.dest.well : ''}
            ingredNames={props.ingredNames}
            ingreds={compactedDestPreIngreds} />
        )}>
        {(hoverTooltipHandlers) => (
          <IngredPill
            hoverTooltipHandlers={hoverTooltipHandlers}
            ingredNames={props.ingredNames}
            ingreds={compactedDestPreIngreds} />
        )}
      </HoverTooltip>
    </PDListItem>
  )
}
