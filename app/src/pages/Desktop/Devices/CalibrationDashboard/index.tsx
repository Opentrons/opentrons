import { useParams } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { CalibrationTaskList } from '/app/organisms/Desktop/CalibrationTaskList'
import { OPENTRONS_USB } from '/app/redux/discovery'
import { appShellRequestor } from '/app/redux/shell/remote'
import { useDashboardCalibrateDeck } from './hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from './hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from './hooks/useDashboardCalibrateTipLength'
import { useRobot } from '/app/redux-resources/robots'

import type { DesktopRouteParams } from '/app/App/types'

export function CalibrationDashboard(): JSX.Element {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
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
    exitBeforeDeckConfigCompletion,
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
        exitBeforeDeckConfigCompletion={exitBeforeDeckConfigCompletion}
      />
      {DashboardDeckCalWizard}
      {DashboardOffsetCalWizard}
      {DashboardTipLengthCalWizard}
    </ApiHostProvider>
  )
}
