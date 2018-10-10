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
  const disabled = robot.status !== 'connectable'
  const updateUrl = `/robots/${robot.name}/update`

  return (
    <CardContainer>
      <CardRow>
        <StatusCard robot={robot} disabled={disabled} />
      </CardRow>
      <CardRow>
        <InformationCard robot={robot} updateUrl={updateUrl} />
      </CardRow>
      <CardRow>
        <ControlsCard robot={robot} disabled={disabled} />
      </CardRow>
      <CardRow>
        <CardColumn>
          <ConnectivityCard robot={robot} disabled={disabled} />
        </CardColumn>
        <CardColumn>
          <CalibrationCard robot={robot} disabled={disabled} />
        </CardColumn>
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard robot={robot} disabled={disabled} />
      </CardRow>
    </CardContainer>
  )
}

export {ConnectAlertModal, RobotUpdateModal}
