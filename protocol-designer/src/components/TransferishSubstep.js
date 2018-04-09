// @flow
import * as React from 'react'
import last from 'lodash/last'
import {Icon} from '@opentrons/components'

import styles from './StepItem.css'

import type {
  TransferishStepItem,
  StepItemSourceDestRowMulti
} from '../steplist/types'

export type StepSubItemProps = {|
  substeps: TransferishStepItem
|}

type MultiChannelSubstepProps = {
  volume: ?string,
  rowGroup: Array<StepItemSourceDestRowMulti>,
  sourceIngredientName: ?string,
  destIngredientName: ?string
}

const VOLUME_DIGITS = 1
const DEFAULT_COLLAPSED_STATE = true

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
      sourceIngredientName
      // destIngredientName
    } = this.props

    const lastGroupSourceWell = last(rowGroup).sourceWell
    const sourceWellRange = (rowGroup[0].sourceWell && lastGroupSourceWell)
      ? `${rowGroup[0].sourceWell}:${lastGroupSourceWell}`
      : ''

    const lastGroupDestWell = last(rowGroup).destWell
    const destWellRange = (rowGroup[0].destWell && lastGroupDestWell)
      ? `${rowGroup[0].destWell}:${lastGroupDestWell}`
      : ''

    const collapsed = this.state.collapsed

    return (
      <ol>
        {/* TODO special class for this substep subheader thing?? */}
        <li className={styles.step_subitem}>
          <span>{sourceIngredientName}</span>
          <span className={styles.emphasized_cell}>{sourceWellRange}</span>
          <span className={styles.volume_cell}>{volume && `${volume} μL`}</span>
          <span className={styles.emphasized_cell}>{destWellRange}</span>
          {/* <span>{destIngredientName}</span> */}
          <span className={styles.inner_carat} onClick={() => this.handleToggleCollapsed()}>
            <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} />
          </span>
        </li>

        {!collapsed && rowGroup.map((row, rowKey) =>
          // Channel rows (1 for each channel in multi-channel pipette)
          <li className={styles.step_subitem_channel_row} key={rowKey}>
            <span>{row.sourceIngredientName}</span>
            <span className={styles.emphasized_cell}>{row.sourceWell}</span>
            <span className={styles.volume_cell}>{volume && `${volume} μL`}</span>
            <span className={styles.emphasized_cell}>{row.destWell}</span>
            <span>{row.destIngredientName}</span>
          </li>
      )}
      </ol>
    )
  }
}

// This "transferish" substep component is for transfer/distribute/consolidate
export default function TransferishSubstep (props: StepSubItemProps) {
  const {substeps} = props
  if (substeps.multichannel) {
    // multi-channel row item (collapsible)
    return <li>
      {substeps.multiRows.map((rowGroup, groupKey) =>
        <MultiChannelSubstep
          key={groupKey}
          rowGroup={rowGroup}
          volume={typeof substeps.volume === 'number'
            ? parseFloat(substeps.volume.toFixed(VOLUME_DIGITS)).toString()
            : null
          }
          // TODO LATER Ian 2018-04-06 ingredient name & color passed in from store
          sourceIngredientName='ING11'
          destIngredientName='ING12'
        />
      )}
    </li>
  }

  // single-channel row item
  return substeps.rows.map((row, key) =>
    <li key={key} className={styles.step_subitem} /* onMouseOver={onMouseOver} */>
      <span>{row.sourceIngredientName}</span>
      <span className={styles.emphasized_cell}>{row.sourceWell}</span>
      <span className={styles.volume_cell}>{
        typeof row.volume === 'number' &&
        `${parseFloat(row.volume.toFixed(VOLUME_DIGITS))} μL`
      }</span>
      <span className={styles.emphasized_cell}>{row.destWell}</span>
      <span>{row.destIngredientName}</span>
    </li>
  )
}
