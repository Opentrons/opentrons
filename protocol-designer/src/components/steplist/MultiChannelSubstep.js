// @flow
import * as React from 'react'
import cx from 'classnames'
import uniqBy from 'lodash/uniqBy'

import SubstepRow from './SubstepRow'
import styles from './StepItem.css'

import type {StepItemSourceDestRowMulti} from '../../steplist/types'

const DEFAULT_COLLAPSED_STATE = true

type MultiChannelSubstepProps = {|
  rowGroup: Array<StepItemSourceDestRowMulti>,
  highlighted?: boolean,
  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed,
|}

type MultiChannelSubstepState = {
  collapsed: boolean,
}

export default class MultiChannelSubstep extends React.Component<MultiChannelSubstepProps, MultiChannelSubstepState> {
  constructor (props: MultiChannelSubstepProps) {
    super(props)
    this.state = {
      collapsed: DEFAULT_COLLAPSED_STATE,
    }
  }

  handleToggleCollapsed = () => {
    this.setState({
      ...this.state,
      collapsed: !this.state.collapsed,
    })
  }

  render () {
    const {
      rowGroup,
      highlighted,
    } = this.props

    const collapsed = this.state.collapsed

    return (
      <ol
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        className={cx({[styles.highlighted]: highlighted})}
      >
        {/* Header row */}
        <SubstepRow
          className={cx(styles.step_subitem, {[styles.clear_border]: highlighted})}
          source={{
            preIngreds: rowGroup[0].source.preIngreds[rowGroup[0].source.wells[0]],
            well: rowGroup[0].source.wells,
          }}
          dest={{
            preIngreds: rowGroup[0].dest.preIngreds[rowGroup[0].dest.wells[0]],
            well: rowGroup[0].dest.wells,
          }}
          volume={rowGroup[0] && rowGroup[0].volume}
          ingredNames={this.props.ingredNames}
          collapsible
          collapsed={collapsed}
          toggleCollapsed={this.handleToggleCollapsed} />

        {collapsed && rowGroup.map((row, rowKey) => {
          // Channel rows (1 for each channel in multi-channel pipette
          const channelSource = {
            labware: row.source,
            well: row.source.wells[rowKey],
            postIngreds: row.source.postIngreds[row.source.wells[rowKey]],
            preIngreds: row.source.preIngreds[row.source.wells[rowKey]],
          }
          const channelDest = {
            labware: row.dest,
            well: row.dest.wells[rowKey],
            postIngreds: row.dest.postIngreds[row.dest.wells[rowKey]],
            preIngreds: row.dest.preIngreds[row.dest.wells[rowKey]],
          }
          console.log(row)
          return (
            <SubstepRow
              key={rowKey}
              className={styles.step_subitem_channel_row}
              volume={row.volume}
              ingredNames={this.props.ingredNames}
              source={channelSource}
              dest={channelDest}
            />
          )
        }
      )}
      </ol>
    )
  }
}
