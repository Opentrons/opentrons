// @flow
// robot status panel with connect button
import * as React from 'react'

import {CardContainer, CardRow, CardColumn} from '../layout'
import StatusCard from './StatusCard'
import InformationCard from './InformationCard'
import ControlsCard from './ControlsCard'
import ConnectivityCard from './ConnectivityCard'
import CalibrationCard from './CalibrationCard'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import ConnectAlertModal from './ConnectAlertModal'
import RobotUpdateModal from './RobotUpdateModal'

import type {ViewableRobot} from '../../discovery'

type Props = {
  robot: ViewableRobot,
  updateUrl: string,
  calibrateDeckUrl: string,
  resetUrl: string,
}

export default function RobotSettings (props: Props) {
  const {robot, updateUrl, calibrateDeckUrl, resetUrl} = props

  return (
    <CardContainer>
      <CardRow>
        <StatusCard robot={robot} />
      </CardRow>
      <CardRow>
        <InformationCard robot={robot} updateUrl={updateUrl} />
      </CardRow>
      <CardRow>
        <ControlsCard robot={robot} />
      </CardRow>
      <CardRow>
        <CardColumn>
          <ConnectivityCard robot={robot} />
        </CardColumn>
        <CardColumn>
          <CalibrationCard robot={robot} calibrateDeckUrl={calibrateDeckUrl} />
        </CardColumn>
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard robot={robot} resetUrl={resetUrl} />
      </CardRow>
    </CardContainer>
  )
}

export {ConnectAlertModal, RobotUpdateModal}
