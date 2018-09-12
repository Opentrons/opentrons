// @flow
import React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import {
  constants as robotConstants,
  selectors as robotSelectors,
  type Pipette,
} from '../../robot'

import {TitledList} from '@opentrons/components'
import PipetteListItem from './PipetteListItem'

type Props = {
  pipettes: Array<Pipette>,
  isRunning: boolean,
}

const TITLE = 'Pipette Calibration'

export default withRouter(connect(mapStateToProps)(PipetteList))

function PipetteList (props: Props) {
  const {pipettes, isRunning} = props

  return (
    <TitledList title={TITLE}>
      {robotConstants.PIPETTE_MOUNTS.map((mount) => (
        <PipetteListItem
          key={mount}
          mount={mount}
          isRunning={isRunning}
          pipette={pipettes.find((i) => i.mount === mount)}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state): Props {
  return {
    pipettes: robotSelectors.getPipettes(state),
    isRunning: robotSelectors.getIsRunning(state),
  }
}
