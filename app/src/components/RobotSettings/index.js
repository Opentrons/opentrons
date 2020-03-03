// @flow
// robot status panel with connect button
import * as React from 'react'

import { CardContainer, CardRow } from '../layout'
import { StatusCard } from './StatusCard'
import { InformationCard } from './InformationCard'
import { ControlsCard } from './ControlsCard'
import { ConnectionCard } from './ConnectionCard'
import { AdvancedSettingsCard } from './AdvancedSettingsCard'
import type { ViewableRobot } from '../../discovery/types'

export { ConnectAlertModal } from './ConnectAlertModal'

export type RobotSettingsProps = {|
  robot: ViewableRobot,
  updateUrl: string,
  calibrateDeckUrl: string,
  resetUrl: string,
|}

export function RobotSettings(props: RobotSettingsProps) {
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
