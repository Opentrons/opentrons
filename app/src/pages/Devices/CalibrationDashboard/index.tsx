import * as React from 'react'
import { useParams } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { CalibrationTaskList } from '../../../organisms/CalibrationTaskList'
import { useDashboardCalibratePipOffset } from './hooks/useDashboardCalibratePipOffset'
import { useRobot } from '../../../organisms/Devices/hooks'
import type { DesktopRouteParams } from '../../../App/types'

export function CalibrationDashboard(): JSX.Element {
  const { robotName } = useParams<DesktopRouteParams>()
  const robot = useRobot(robotName)
  const [
    dashboardOffsetCalLauncher,
    DashboardOffsetCalWizard,
  ] = useDashboardCalibratePipOffset(robotName)
  return (
    <ApiHostProvider key={robot?.name} hostname={robot?.ip ?? null}>
      <CalibrationTaskList
        robotName={robotName}
        pipOffsetCalLauncher={dashboardOffsetCalLauncher}
      />
      {DashboardOffsetCalWizard}
    </ApiHostProvider>
  )
}
