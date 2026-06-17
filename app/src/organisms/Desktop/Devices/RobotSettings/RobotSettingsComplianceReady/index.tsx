import { PersonalAccountSettings } from './PersonalAccountSettings'

import type { JSX } from 'react'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
  isRobotBusy: boolean
}

export function RobotSettingsComplianceReady({
  robotName,
}: RobotSettingsComplianceReadyProps): JSX.Element {
  return <PersonalAccountSettings robotName={robotName} />
}
