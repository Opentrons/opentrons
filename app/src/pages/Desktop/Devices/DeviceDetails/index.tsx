import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import { ApiHostProvider } from '@opentrons/react-api-client'

import { useSyncRobotClock } from '/app/organisms/Desktop/Devices/hooks'
import { getScanning, OPENTRONS_USB } from '/app/redux/discovery'
import { appShellRequestor } from '/app/redux/shell/remote'
import { DeviceDetailsComponent } from './DeviceDetailsComponent'
import { useRobot } from '/app/redux-resources/robots'

import type { DesktopRouteParams } from '/app/App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const isScanning = useSelector(getScanning)

  useSyncRobotClock(robotName)

  if (robot == null && isScanning) return null

  return robot != null ? (
    // TODO(bh, 2023-05-31): substitute wrapped AppApiHostProvider that registers/authorizes
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
      <DeviceDetailsComponent robotName={robotName} />
    </ApiHostProvider>
  ) : (
    <Navigate to="/devices" />
  )
}
