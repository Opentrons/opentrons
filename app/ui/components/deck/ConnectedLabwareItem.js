// @flow
// import * as React from 'react'
import {connect} from 'react-redux'

import LabwareItem from './LabwareItem'

import {
  selectors as robotSelectors
//   actions as robotActions
} from '../../robot'

const mapStateToProps = (state, ownProps) => {
  const {slotName} = ownProps
  const labware = robotSelectors.getLabware(state)
  const containerType = slotName in labware && labware[slotName].type
  const wellContents = {'A1': {selected: true}} // TODO: what will this look like for App?
  return {containerType, wellContents}
}

const ConnectedLabwareItem = connect(mapStateToProps)(LabwareItem)

export default ConnectedLabwareItem
