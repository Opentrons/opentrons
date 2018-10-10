// @flow
// robot status panel with connect button
import * as React from 'react'

import StatusCard from './StatusCard'
import InformationCard from './InformationCard'
import ControlsCard from './ControlsCard'
import ConnectivityCard from './ConnectivityCard'
import CalibrationCard from './CalibrationCard'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import ConnectAlertModal from './ConnectAlertModal'
import RobotUpdateModal from './RobotUpdateModal'
import {CardContainer, CardRow, CardColumn} from '../layout'

import type {ViewableRobot} from '../../discovery'

type Props = {robot: ViewableRobot}

export default function RobotSettings (props: Props) {
  const {robot} = props
  const updateUrl = `/robots/${robot.name}/update`

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
          <CalibrationCard robot={robot} />
        </CardColumn>
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard robot={robot} />
      </CardRow>
    </CardContainer>
  )
}

export {ConnectAlertModal, RobotUpdateModal}
