// @flow
import {connect} from 'react-redux'
import {SidePanelGroup, type IconName, FLASK} from '@opentrons/components'

import {
  selectors as robotSelectors
} from '../../robot'

const TITLE = 'Deck Calibration'

type StateProps = {
  title: string,
  iconName: IconName,
  disabled: boolean,
}

export default connect(mapStateToProps)(SidePanelGroup)

function mapStateToProps (state): StateProps {
  const instrumentsCalibrated = robotSelectors.getInstrumentsCalibrated(state)
  const isRunning = robotSelectors.getIsRunning(state)
  const disabled = isRunning || !instrumentsCalibrated

  return {
    title: TITLE,
    iconName: FLASK,
    disabled
  }
}
