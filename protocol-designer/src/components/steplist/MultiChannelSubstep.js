// @flow
import * as React from 'react'
import cx from 'classnames'
import uniqBy from 'lodash/uniqBy'

import SubstepRow from './SubstepRow'
import styles from './StepItem.css'

import type {StepItemSourceDestRowMulti} from '../../steplist/types'

const DEFAULT_COLLAPSED_STATE = true

type MultiChannelSubstepProps = {|
  volume: ?string | ?number,
  rowGroup: Array<StepItemSourceDestRowMulti>,
  highlighted?: boolean,
  onMouseEnter?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed
|}

type MultiChannelSubstepState = {
  collapsed: boolean
}

export default class MultiChannelSubstep extends React.Component<MultiChannelSubstepProps, MultiChannelSubstepState> {
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
