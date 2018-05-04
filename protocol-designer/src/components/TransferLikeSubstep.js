// @flow
import * as React from 'react'
import cx from 'classnames'
import last from 'lodash/last'
import uniqBy from 'lodash/uniqBy'

import {Icon} from '@opentrons/components'
import IngredPill from './IngredPill'

import styles from './StepItem.css'

import type {
  TransferLikeSubstepItem,
  StepItemSourceDestRowMulti,
  SubstepIdentifier,
  NamedIngred
} from '../steplist/types'

export type StepSubItemProps = {|
  substeps: TransferLikeSubstepItem
|}

const DEFAULT_COLLAPSED_STATE = true

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
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed
|}

function SubstepRow (props: SubstepRowProps) {
  const sourceWellRange = wellRange(props.sourceWells)
  const destWellRange = wellRange(props.destWells)

  const formattedVolume = formatVolume(props.volume)

  return (
    <li className={props.className}
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
    </li>
  )
}

type MultiChannelSubstepProps = {|
  volume: ?string | ?number,
  rowGroup: Array<StepItemSourceDestRowMulti>,
  highlighted?: boolean,
  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed
|}

class MultiChannelSubstep extends React.Component<MultiChannelSubstepProps, {collapsed: boolean}> {
  constructor (props: MultiChannelSubstepProps) {
    super(props)
    this.state = {
      collapsed: DEFAULT_COLLAPSED_STATE
    }
  }

  handleToggleCollapsed = () => {
    this.setState({
      ...this.state,
      collapsed: !this.state.collapsed
    })
  }

  render () {
    const {
      volume,
      rowGroup,
      highlighted
    } = this.props

    const collapsed = this.state.collapsed

    return (
      <ol
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        className={cx(styles.substep, {[styles.highlighted]: highlighted})}
      >
        {/* Header row */}
        <SubstepRow
          className={styles.step_subitem}
          sourceIngredients={uniqBy(
            rowGroup.reduce((acc, row) => (row.sourceIngredients)
              ? [...acc, ...row.sourceIngredients]
              : acc,
            []),
            ingred => ingred.id
          )}
          sourceWells={rowGroup.map(row => row.sourceWell)}
          destWells={rowGroup.map(row => row.destWell)}
          volume={volume}
          collapsible
          collapsed={collapsed}
          toggleCollapsed={this.handleToggleCollapsed}
        />

        {!collapsed && rowGroup.map((row, rowKey) =>
          // Channel rows (1 for each channel in multi-channel pipette
          <SubstepRow
            key={rowKey}
            className={styles.step_subitem_channel_row}
            volume={volume}
            hideVolumeUnits
            sourceIngredients={row.sourceIngredients}
            sourceWells={row.sourceWell}
            destWells={row.destWell}
            destIngredients={row.destIngredients}
          />
      )}
      </ol>
    )
  }
}

type TransferLikeSubstepProps = {|
  ...StepSubItemProps,
  onSelectSubstep: SubstepIdentifier => mixed,
  hoveredSubstep: SubstepIdentifier
|}

// This "TransferLike" substep component is for transfer/distribute/consolidate
export default function TransferLikeSubstep (props: TransferLikeSubstepProps) {
  const {substeps, onSelectSubstep, hoveredSubstep} = props
  if (substeps.multichannel) {
    // multi-channel row item (collapsible)
    return <li>
      {substeps.multiRows.map((rowGroup, groupKey) =>
        <MultiChannelSubstep
          key={groupKey}
          rowGroup={rowGroup}
          volume={substeps.volume}
          onMouseEnter={() => onSelectSubstep({
            stepId: substeps.parentStepId,
            substepId: groupKey
          })}
          onMouseLeave={() => onSelectSubstep(null)}
          highlighted={!!hoveredSubstep &&
            hoveredSubstep.stepId === substeps.parentStepId &&
            hoveredSubstep.substepId === groupKey
          }
        />
      )}
    </li>
  }

  // single-channel row item
  return substeps.rows.map((row, substepId) =>
    <SubstepRow
      key={substepId}
      className={cx(
        styles.step_subitem,
        {[styles.highlighted]:
          !!hoveredSubstep &&
          hoveredSubstep.stepId === substeps.parentStepId &&
          substepId === hoveredSubstep.substepId
        }
      )}
      onMouseEnter={() => onSelectSubstep({
        stepId: substeps.parentStepId,
        substepId
      })}
      onMouseLeave={() => onSelectSubstep(null)}
      volume={row.volume}
      sourceIngredients={row.sourceIngredients}
      sourceWells={row.sourceWell}
      destIngredients={row.destIngredients}
      destWells={row.destWell}
    />
  )
}
