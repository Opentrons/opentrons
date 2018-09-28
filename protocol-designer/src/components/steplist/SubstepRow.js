// @flow
import * as React from 'react'
import last from 'lodash/last'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import omitBy from 'lodash/omitBy'

import {Icon, HoverTooltip, swatchColors} from '@opentrons/components'
import IngredPill from './IngredPill'
import {PDListItem} from '../lists'
import styles from './StepItem.css'

import type {NamedIngred} from '../../steplist/types'

type SubstepRowProps = {|
  volume?: ?number | ?string,
  /** if true, hide 'μL' on volume */
  hideVolumeUnits?: boolean,

  sourceWells?: ?string | ?Array<?string>,
  destWells?: ?string | ?Array<?string>,

  className?: string,

  sourceIngredients?: Array<NamedIngred>,
  destIngredients?: Array<NamedIngred>,

  collapsible?: boolean,
  collapsed?: boolean,
  toggleCollapsed?: (e: SyntheticMouseEvent<*>) => mixed,

  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed,
|}

const VOLUME_DIGITS = 1

function formatVolume (inputVolume: ?string | ?number): ?string {
  if (typeof inputVolume === 'number') {
    // don't add digits to numbers with nothing to the right of the decimal
    const digits = inputVolume.toString().split('.')[1]
      ? VOLUME_DIGITS
      : 0
    return inputVolume.toFixed(digits)
  }

  return inputVolume
}

const formatPercentage = (part: number, total: number): string => {
  return `${Number((part / total) * 100).toFixed(1)}%`
}

const PillTooltipContents = (props) => {
  const totalLiquidVolume = reduce(props.ingreds, (acc, ingred) => acc + ingred.volume, 0)
  const hasMultipleIngreds = Object.keys(props.ingreds).length > 1
  return (
    <div className={styles.liquid_tooltip_contents}>
      {map(props.ingreds, (ingred, groupId) => (
        <div key={groupId} className={styles.ingred_row}>
          <div className={styles.ingred_row_left}>
            <div
              className={styles.liquid_circle}
              style={{backgroundColor: swatchColors(Number(groupId))}} />
            <span>{props.ingredNames[groupId]}</span>
          </div>
          <div className={styles.ingred_row_right}>
            {
              hasMultipleIngreds &&
              <span className={styles.ingred_percentage}>{formatPercentage(ingred.volume, totalLiquidVolume)}</span>
            }
            <span className={styles.ingred_partial_volume}>{ingred.volume}µl</span>
          </div>
        </div>
      ))}
      {
        hasMultipleIngreds &&
        <React.Fragment>
          <div className={styles.total_divider}></div>
          <div className={styles.total_row}>
            <span>{`${props.well} Total Volume`}</span>
            <span>{totalLiquidVolume}µl</span>
          </div>
        </React.Fragment>
      }
    </div>
  )
}

export default function SubstepRow (props: SubstepRowProps) {
  const compactedSourcePreIngreds = props.source && omitBy(props.source.preIngreds, ingred => ingred.volume < 1)
  const compactedDestPreIngreds = props.dest && omitBy(props.dest.preIngreds, ingred => ingred.volume < 1)
  return (
    <PDListItem
      border
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}>
      <HoverTooltip
        tooltipComponent={(
          <PillTooltipContents
            well={props.source && props.source.well}
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
            well={props.dest && props.dest.well}
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
