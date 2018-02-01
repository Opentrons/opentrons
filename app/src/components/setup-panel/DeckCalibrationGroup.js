// @flow
import {connect} from 'react-redux'
import {SidePanelGroup, type IconName} from '@opentrons/components'

import {
  selectors as robotSelectors
} from '../../robot'

type Props = {
  disabled: boolean,
  title?: string,
  iconName?: IconName
}

export default connect(mapStateToProps)(SidePanelGroup)

function mapStateToProps (state): Props {
  const instrumentsCalibrated = robotSelectors.getInstrumentsCalibrated(state)
  const isRunning = robotSelectors.getIsRunning(state)
  const disabled = isRunning || !instrumentsCalibrated
  return {
    disabled,
    title: 'Deck Calibration',
    iconName: 'flask'
  }
}
