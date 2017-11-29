import React from 'react'
import {connect} from 'react-redux'
import {
  selectors as robotSelectors
} from '../../../robot'

import TitledList from './TitledList'
import LabwareListItem from './LabwareListItem'

export default connect(mapStateToProps)(LabwareList)

function LabwareList (props) {
  const title = 'Labware Setup'
  const {
    // isRunning,
    labware,
    instrumentsCalibrated,
    tipracksConfirmed
  } = props
  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const {slot, name, isTiprack} = lab
    // const onClick = setLabware(slot)

    const links = (
      <LabwareListItem
        {...lab}
        key={slot}
        instrumentsCalibrated={instrumentsCalibrated}
        tipracksConfirmed={tipracksConfirmed}
        // onClick={!isRunning && onClick}
      />
    )

    if (name && isTiprack) {
      result.tiprackList.push(links)
    } else if (name) {
      result.labwareList.push(links)
    }

    return result
  }, {tiprackList: [], labwareList: []})

  return (
    <TitledList title={title}>
      {tiprackList}
      {labwareList}
    </TitledList>
  )
}

function mapStateToProps (state) {
  return {
    labware: robotSelectors.getLabware(state),
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    singleChannel: robotSelectors.getSingleChannel(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

// <LabwareListItem key={labware.name} {...props} {...lab} />
