// @flow
// info panel and controls for labware calibration page
import * as React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  type Labware
} from '../../robot'

import {UNCHECKED, CHECKED} from '@opentrons/components'
import CalibrationInfoBox from '../CalibrationInfoBox'

// TODO(mc, 2018-02-05): match screens instead of using this old component
import ConfirmCalibrationPrompt from '../deck/ConfirmCalibrationPrompt'

type OwnProps = {slot: ?string}

export default connect(mapStateToProps)(LabwareCalibrationInfo)

function LabwareCalibrationInfo (props: Labware) {
  const {slot, name, type, confirmed} = props
  const title = `${name} - ${type}`
  const iconName = confirmed
    ? CHECKED
    : UNCHECKED

  return (
    <CalibrationInfoBox iconName={iconName} title={title}>
      <ConfirmCalibrationPrompt slot={slot} currentLabware={props} />
    </CalibrationInfoBox>
  )
}

function mapStateToProps (state, ownProps: OwnProps): Labware {
  // TODO(mc, 2018-02-05): getCurrentLabware selector
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lw) => lw.slot === ownProps.slot)

  // TODO(mc, 2018-02-05): refactor so this check isn't necessary
  if (!currentLabware) {
    throw new Error('no currentLabware')
  }

  return currentLabware
}
