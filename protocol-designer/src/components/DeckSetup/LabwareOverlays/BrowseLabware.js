// @flow
import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { Icon } from '@opentrons/components'
import type { ThunkDispatch } from '../../../types'
import type { LabwareEntity } from '../../../step-forms'
import { drillDownOnLabware } from '../../../labware-ingred/actions'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareEntity: LabwareEntity,
|}

type DP = {|
  drillDown: () => mixed,
|}

type Props = { ...OP, ...DP }

function BrowseLabwareOverlay(props: Props) {
  if (props.labwareEntity.def.parameters.isTiprack) return null
  return (
    <div className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <a className={styles.overlay_button} onClick={props.drillDown}>
        <Icon className={styles.overlay_icon} name="water" />
        View Liquids
      </a>
    </div>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  drillDown: () => dispatch(drillDownOnLabware(ownProps.labwareEntity.id)),
})

export default connect<Props, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(BrowseLabwareOverlay)
