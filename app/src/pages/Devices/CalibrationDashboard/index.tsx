import * as React from 'react'
import { useParams } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { CalibrationTaskList } from '../../../organisms/CalibrationTaskList'
import { OPENTRONS_USB } from '../../../redux/discovery'
import { appShellRequestor } from '../../../redux/shell/remote'
import { useDashboardCalibrateDeck } from './hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from './hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from './hooks/useDashboardCalibrateTipLength'
import { useRobot } from '../../../organisms/Devices/hooks'

import type { DesktopRouteParams } from '../../../App/types'

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
    <ApiHostProvider
      key={robot?.name}
      hostname={robot?.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
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
