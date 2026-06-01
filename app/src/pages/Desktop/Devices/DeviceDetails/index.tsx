import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import { ApiHostProvider } from '@opentrons/react-api-client'

import { useSyncRobotClock } from '/app/organisms/Desktop/Devices/hooks'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'
import { useRobot } from '/app/redux-resources/robots'
import { getScanning, OPENTRONS_USB } from '/app/redux/discovery'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import { DeviceDetailsComponent } from './DeviceDetailsComponent'

import type { DesktopRouteParams } from '/app/App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const robot = useRobot(robotName)
  const isScanning = useSelector(getScanning)
  const token = useAccessTokenForRobot(robotName)

  useSyncRobotClock(robotName)

  if (robot == null && isScanning) return null

  return robot != null ? (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined}
      token={token}
    >
      <RobotCertRotator>
        <DeviceDetailsComponent robotName={robotName} />
      </RobotCertRotator>
    </ApiHostProvider>
  ) : (
    <Navigate to="/devices" />
  )
}
