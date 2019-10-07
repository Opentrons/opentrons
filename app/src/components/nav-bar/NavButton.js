// @flow
// nav button container
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'

import {
  getAvailableShellUpdate,
  getBuildrootUpdateAvailable,
} from '../../shell'
import { getConnectedRobot } from '../../discovery'
import { NavButton } from '@opentrons/components'

import type { ContextRouter } from 'react-router-dom'
import type { State } from '../../types'
import { Portal } from '../portal'

type OP = {| ...ContextRouter, name: string |}

type Props = React.ElementProps<typeof NavButton>

export default withRouter<_, _>(
  connect<Props, OP, _, _, _, _>(mapStateToProps)(NavButton)
)

function mapStateToProps(state: State, ownProps: OP): $Exact<Props> {
  const { name } = ownProps
  const isProtocolLoaded = robotSelectors.getSessionIsLoaded(state)
  const isProtocolRunning = robotSelectors.getIsRunning(state)
  const isProtocolDone = robotSelectors.getIsDone(state)
  const connectedRobot = getConnectedRobot(state)
  const robotNotification =
    connectedRobot != null &&
    getBuildrootUpdateAvailable(state, connectedRobot) === 'upgrade'
  const moreNotification = getAvailableShellUpdate(state) != null

  // TODO: IMMEDIATELY make selector
  const incompatiblePipettes = true

  const TooltipPortal = props => <Portal level="global" {...props} />

  switch (name) {
    case 'connect':
      return {
        iconName: 'ot-connect',
        title: 'robot',
        url: '/robots',
        notification: robotNotification,
      }
    case 'upload':
      return {
        disabled: connectedRobot == null || isProtocolRunning,
        iconName: 'ot-file',
        title: 'protocol',
        url: '/upload',
      }
    case 'setup':
      return {
        disabled:
          !isProtocolLoaded ||
          isProtocolRunning ||
          isProtocolDone ||
          incompatiblePipettes,
        tooltipComponent: incompatiblePipettes
          ? 'Attached pipettes do not match pipettes specified in loaded protocol'
          : null,
        tooltipPortal: TooltipPortal,
        iconName: 'ot-calibrate',
        title: 'calibrate',
        url: '/calibrate',
      }
    case 'run':
      return {
        disabled: !isProtocolLoaded || incompatiblePipettes,
        tooltipComponent: incompatiblePipettes
          ? 'Attached pipettes do not match pipettes specified in loaded protocol'
          : null,
        tooltipPortal: TooltipPortal,
        iconName: 'ot-run',
        title: 'run',
        url: '/run',
      }
  }

  // case 'more':
  return {
    iconName: 'dots-horizontal',
    isBottom: true,
    title: 'more',
    url: '/menu',
    notification: moreNotification,
  }
}
