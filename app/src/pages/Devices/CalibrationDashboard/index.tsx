import type { DesktopRouteParams } from '../../../App/types'
import { CalibrationTaskList } from '../../../organisms/CalibrationTaskList'
import { useRobot } from '../../../organisms/Devices/hooks'
import { useDashboardCalibrateDeck } from './hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from './hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from './hooks/useDashboardCalibrateTipLength'
import { ApiHostProvider } from '@opentrons/react-api-client'
import * as React from 'react'
import { useParams } from 'react-router-dom'

export function CalibrationDashboard(): JSX.Element {
  const { robotName } = useParams<DesktopRouteParams>()
  const robot = useRobot(robotName)
  const [
    dashboardOffsetCalLauncher,
    DashboardOffsetCalWizard,
  ] = useDashboardCalibratePipOffset(robotName)
  const [
    dashboardTipLengthCalLauncher,
    DashboardTipLengthCalWizard,
  ] = useDashboardCalibrateTipLength(robotName)
  const [
    dashboardDeckCalLauncher,
    DashboardDeckCalWizard,
  ] = useDashboardCalibrateDeck(robotName)
  return (
    <ApiHostProvider key={robot?.name} hostname={robot?.ip ?? null}>
      <CalibrationTaskList
        robotName={robotName}
        deckCalLauncher={dashboardDeckCalLauncher}
        tipLengthCalLauncher={dashboardTipLengthCalLauncher}
        pipOffsetCalLauncher={dashboardOffsetCalLauncher}
      />
      {DashboardDeckCalWizard}
      {DashboardOffsetCalWizard}
      {DashboardTipLengthCalWizard}
    </ApiHostProvider>
  )
}
