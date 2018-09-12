// @flow
import {connect} from 'react-redux'
import {SidePanelGroup} from '@opentrons/components'

import {
  selectors as robotSelectors,
} from '../../robot'

const TITLE = 'Labware Calibration'

type StateProps = {
  title: string,
  disabled: boolean,
}

export default connect(mapStateToProps)(SidePanelGroup)

function mapStateToProps (state): StateProps {
  const isRunning = robotSelectors.getIsRunning(state)
  const disabled = isRunning

  return {
    title: TITLE,
    disabled,
  }
}
