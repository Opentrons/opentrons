// @flow
// robot status panel with connect button
import * as React from 'react'

import { CardContainer, CardRow } from '../layout'
import StatusCard from './StatusCard'
import InformationCard from './InformationCard'
import { ControlsCard } from './ControlsCard'
import { ConnectionCard } from './ConnectionCard'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import ConnectAlertModal from './ConnectAlertModal'

import type { ViewableRobot } from '../../discovery/types'

type Props = {
  robot: ViewableRobot,
  updateUrl: string,
  calibrateDeckUrl: string,
  resetUrl: string,
}

export default function RobotSettings(props: Props) {
  const { robot, updateUrl, calibrateDeckUrl, resetUrl } = props

  return (
    <CardContainer>
      <CardRow>
        <StatusCard robot={robot} />
      </CardRow>
      <CardRow>
        <InformationCard robot={robot} updateUrl={updateUrl} />
      </CardRow>
      <CardRow>
        <ControlsCard robot={robot} calibrateDeckUrl={calibrateDeckUrl} />
      </CardRow>
      <CardRow>
        <ConnectionCard robot={robot} />
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard robot={robot} resetUrl={resetUrl} />
      </CardRow>
    </CardContainer>
  )
}

export { ConnectAlertModal }
