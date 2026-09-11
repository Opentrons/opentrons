import { useParams } from 'react-router-dom'

import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { CalibrationTaskList } from '/app/organisms/Desktop/CalibrationTaskList'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'

import { useDashboardCalibrateDeck } from './hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from './hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from './hooks/useDashboardCalibrateTipLength'

import type { DesktopRouteParams } from '/app/App/types'

export function CalibrationDashboard(): JSX.Element {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const [dashboardOffsetCalLauncher, DashboardOffsetCalWizard] =
    useDashboardCalibratePipOffset(robotName)
  const [dashboardTipLengthCalLauncher, DashboardTipLengthCalWizard] =
    useDashboardCalibrateTipLength(robotName)
  const [
    dashboardDeckCalLauncher,
    DashboardDeckCalWizard,
    exitBeforeDeckConfigCompletion,
  ] = useDashboardCalibrateDeck(robotName)
  return (
    <ApiHostProvider key={robotName} robotName={robotName}>
      <RobotCertRotator>
        <CalibrationTaskList
          robotName={robotName}
          deckCalLauncher={dashboardDeckCalLauncher}
          tipLengthCalLauncher={dashboardTipLengthCalLauncher}
          pipOffsetCalLauncher={dashboardOffsetCalLauncher}
          exitBeforeDeckConfigCompletion={exitBeforeDeckConfigCompletion}
        />

        {DashboardDeckCalWizard}
        {DashboardOffsetCalWizard}
        {DashboardTipLengthCalWizard}
      </RobotCertRotator>
    </ApiHostProvider>
  )
}
