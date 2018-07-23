// @flow
// LabwareComponent for Deck in ReviewDeckModal
import * as React from 'react'
import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../../robot'

import type {LabwareComponentProps} from '@opentrons/components'
import LabwareItem, {type LabwareItemProps} from '../DeckMap/LabwareItem'
import ModuleItem from '../DeckMap/ModuleItem'

type OP = LabwareComponentProps

type SP = {
  labware: ?$PropertyType<LabwareItemProps, 'labware'>,
  module: ?{}
}

type Props = OP & SP

export default connect(mapStateToProps)(LabwareComponent)

function LabwareComponent (props: Props) {
  return (
    <React.Fragment>
      {props.module && (
        <ModuleItem />
      )}
      {props.labware && (
        <LabwareItem
          slot={props.slot}
          width={props.width}
          height={props.height}
          labware={props.labware}
        />
      )}
    </React.Fragment>
  )
}

function mapStateToProps (state, ownProps: OP): SP {
  const {slot} = ownProps
  const allLabware = robotSelectors.getLabware(state)

  return {
    labware: allLabware.find((lw) => lw.slot === slot),
    module: robotSelectors.getModulesBySlot(state)[slot]
  }
}
