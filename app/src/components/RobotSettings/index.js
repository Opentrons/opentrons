// @flow
// robot status panel with connect button
import * as React from 'react'
import type {Robot} from '../../robot'

import StatusCard from './StatusCard'
import InformationCard from './InformationCard'
import ControlsCard from './ControlsCard'
import ConnectivityCard from './ConnectivityCard'
import CalibrationCard from './CalibrationCard'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import ConnectAlertModal from './ConnectAlertModal'
import RobotUpdateModal from './RobotUpdateModal'
import {CardContainer, CardRow, CardColumn} from '../layout'

type Props = Robot

export default function RobotSettings (props: Props) {
  const updateUrl = `/robots/${props.name}/update`

  return (
    <CardContainer>
      <CardRow>
        <StatusCard {...props} />
      </CardRow>
      <CardRow>
        <InformationCard {...props} updateUrl={updateUrl} />
      </CardRow>
      <CardRow>
        <ControlsCard {...props} />
      </CardRow>
      <CardRow>
        <CardColumn>
          <ConnectivityCard {...props} />
        </CardColumn>
        <CardColumn>
          <CalibrationCard {...props} />
        </CardColumn>
      </CardRow>
      <CardRow>
        <AdvancedSettingsCard {...props} />
      </CardRow>
    </CardContainer>
  )
}

export {ConnectAlertModal, RobotUpdateModal}
