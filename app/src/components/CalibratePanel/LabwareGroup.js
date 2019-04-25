// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { SidePanelGroup } from '@opentrons/components'
import { selectors as robotSelectors } from '../../robot'

const TITLE = 'Labware Calibration'

type SP = {| title: string, disabled: boolean |}

type OP = $Rest<$Exact<React.ElementProps<typeof SidePanelGroup>>, SP>

type Props = { ...OP, ...SP }

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(SidePanelGroup)

function mapStateToProps(state): SP {
  const isRunning = robotSelectors.getIsRunning(state)
  const disabled = isRunning

  return {
    title: TITLE,
    disabled,
  }
}
