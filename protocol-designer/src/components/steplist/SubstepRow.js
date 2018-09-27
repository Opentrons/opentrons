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

function wellRange (sourceWells: string | ?Array<?string>): ?string {
  if (typeof sourceWells === 'string') {
    return sourceWells
  }

  if (!sourceWells || sourceWells.length === 0) {
    return null
  }

  if (sourceWells.length === 1) {
    return sourceWells[0]
  }

  const firstWell = sourceWells[0]
  const lastWell = last(sourceWells)

  if (firstWell && lastWell) {
    return `${firstWell || ''}:${lastWell || ''}`
  }

  return firstWell || lastWell
}

const formatPercentage = (part: number, total: number): string => {
  return `${Number((part / total) * 100).toFixed(1)}%`
}

const PillTooltipContents = (props) => {
  const nonZeroIngreds = omitBy(props.ingreds, ingred => ingred.volume < 1)
  const totalLiquidVolume = reduce(nonZeroIngreds, (acc, ingred) => acc + ingred.volume, 0)
  return (
    <div className={styles.liquid_tooltip_contents}>
      {map(nonZeroIngreds, (ingred, groupId) => (
        <div key={groupId} className={styles.ingred_row}>
          <div className={styles.ingred_row_left}>
            <div
              className={styles.liquid_circle}
              style={{backgroundColor: swatchColors(Number(groupId))}} />
            <span>{props.ingredNames[groupId]}</span>
          </div>
          <div className={styles.ingred_row_right}>
            {
              Object.keys(nonZeroIngreds).length > 1 &&
              <span className={styles.ingred_percentage}>{formatPercentage(ingred.volume, totalLiquidVolume)}</span>
            }
            <span>{ingred.volume}µl</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SubstepRow (props: SubstepRowProps) {
  const sourceWellRange = wellRange(props.source.well)
  const destWellRange = wellRange(props.dest.well)

  const formattedVolume = formatVolume(props.volume)

  const filteredSourcePreIngreds = omitBy(props.source.preIngreds, ingred => ingred.volume < 1)
  const filteredDestPreIngreds = omitBy(props.dest.preIngreds, ingred => ingred.volume < 1)
  return (
    <PDListItem
      border
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}>
      <HoverTooltip
        tooltipComponent={(
          <PillTooltipContents ingredNames={props.ingredNames} ingreds={filteredSourcePreIngreds} />
        )}>
        {(hoverTooltipHandlers) => (
          <IngredPill
            hoverTooltipHandlers={hoverTooltipHandlers}
            ingredNames={props.ingredNames}
            ingreds={filteredSourcePreIngreds} />
        )}
      </HoverTooltip>
      <span className={styles.emphasized_cell}>{sourceWellRange}</span>
      <span className={styles.volume_cell}>{`${formattedVolume} μL`}</span>
      <span className={styles.emphasized_cell}>{destWellRange}</span>
      {props.collapsible
        ? <span className={styles.inner_carat} onClick={props.toggleCollapsed}>
          <Icon name={props.collapsed ? 'chevron-down' : 'chevron-up'} />
        </span>
        : (
          <HoverTooltip
            tooltipComponent={(
              <PillTooltipContents ingredNames={props.ingredNames} ingreds={filteredDestPreIngreds} />
            )}>
            {(hoverTooltipHandlers) => (
              <IngredPill
                hoverTooltipHandlers={hoverTooltipHandlers}
                ingredNames={props.ingredNames}
                ingreds={filteredDestPreIngreds} />
            )}
          </HoverTooltip>
        )
      }
    </PDListItem>
  )
}
