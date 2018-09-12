// @flow
import * as React from 'react'
import last from 'lodash/last'

import {Icon} from '@opentrons/components'
import IngredPill from '../IngredPill'
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

export default function SubstepRow (props: SubstepRowProps) {
  const sourceWellRange = wellRange(props.sourceWells)
  const destWellRange = wellRange(props.destWells)

  const formattedVolume = formatVolume(props.volume)

  return (
    <PDListItem
      border
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <IngredPill ingreds={props.sourceIngredients} />
      <span className={styles.emphasized_cell}>{sourceWellRange}</span>
      <span className={styles.volume_cell}>{
        formattedVolume && (props.hideVolumeUnits
          ? formattedVolume
          : `${formattedVolume} μL`
        )
      }</span>
      <span className={styles.emphasized_cell}>{destWellRange}</span>
      {props.collapsible
        ? <span className={styles.inner_carat} onClick={props.toggleCollapsed}>
          <Icon name={props.collapsed ? 'chevron-down' : 'chevron-up'} />
        </span>
        : <IngredPill ingreds={props.destIngredients} />
      }
    </PDListItem>
  )
}
