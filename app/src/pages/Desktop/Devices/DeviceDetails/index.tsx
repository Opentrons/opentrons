import { useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'

import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useSyncRobotClock } from '/app/organisms/Desktop/Devices/hooks'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'
import { useRobot } from '/app/redux-resources/robots'
import { getScanning } from '/app/redux/discovery'

import { DeviceDetailsComponent } from './DeviceDetailsComponent'

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
    <ApiHostProvider key={robotName} robotName={robotName}>
      <RobotCertRotator>
        <DeviceDetailsComponent robotName={robotName} />
      </RobotCertRotator>
    </ApiHostProvider>
  ) : (
    <Navigate to="/devices" />
  )
}
