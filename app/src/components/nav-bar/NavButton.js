// @flow
// nav button container
import * as React from 'react'
import { useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'

import {
  getAvailableShellUpdate,
  getBuildrootUpdateAvailable,
} from '../../shell'
import { getConnectedRobot } from '../../discovery'
import { NavButton as GenericNavButton } from '@opentrons/components'

import type { ContextRouter } from 'react-router-dom'
import usePipetteInfo from '../FileInfo/usePipetteInfo'
import styles from './styles.css'

type Props = {| ...ContextRouter, name: string |}

function NavButton(props: Props) {
  const { name } = props
  const isProtocolLoaded = useSelector(robotSelectors.getSessionIsLoaded)
  const isProtocolRunning = useSelector(robotSelectors.getIsRunning)
  const isProtocolDone = useSelector(robotSelectors.getIsDone)
  const connectedRobot = useSelector(getConnectedRobot)
  const buildrootUpdateAvailable = useSelector(
    state =>
      connectedRobot != null &&
      getBuildrootUpdateAvailable(state, connectedRobot)
  )
  const robotNotification = buildrootUpdateAvailable === 'upgrade'
  const moreNotification = useSelector(getAvailableShellUpdate) != null
  const pipetteInfo = usePipetteInfo(
    connectedRobot != null ? connectedRobot.name : ''
  )

  const incompatiblePipettes = !pipetteInfo.every(p => p.pipettesMatch)
  const incompatPipetteTooltip = (
    <div className={styles.nav_button_tooltip}>
      Attached pipettes do not match pipettes specified in loaded protocol
    </div>
  )
  switch (name) {
    case 'connect':
      return (
        <GenericNavButton
          iconName="ot-connect"
          title="robot"
          url="/robots"
          notification={robotNotification}
        />
      )
    case 'upload':
      return (
        <GenericNavButton
          disabled={connectedRobot == null || isProtocolRunning}
          iconName="ot-file"
          title="protocol"
          url="/upload"
        />
      )
    case 'setup':
      return (
        <GenericNavButton
          disabled={
            !isProtocolLoaded ||
            isProtocolRunning ||
            isProtocolDone ||
            incompatiblePipettes
          }
          tooltipComponent={
            incompatiblePipettes ? incompatPipetteTooltip : null
          }
          iconName="ot-calibrate"
          title="calibrate"
          url="/calibrate"
        />
      )
    case 'run':
      return (
        <GenericNavButton
          disabled={!isProtocolLoaded || incompatiblePipettes}
          tooltipComponent={
            incompatiblePipettes ? incompatPipetteTooltip : null
          }
          iconName="ot-run"
          title="run"
          url="/run"
        />
      )
  }

  // case 'more':
  return (
    <GenericNavButton
      iconName="dots-horizontal"
      isBottom={true}
      title="more"
      url="/menu"
      notification={moreNotification}
    />
  )
}

export default withRouter(NavButton)
