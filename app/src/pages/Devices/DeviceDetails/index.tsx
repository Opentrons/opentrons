import * as React from 'react'
import { useSelector } from 'react-redux'
import { Redirect, useParams } from 'react-router-dom'

import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot, useSyncRobotClock } from '../../../organisms/Devices/hooks'
import { getScanning, OPENTRONS_USB } from '../../../redux/discovery'
import { appShellRequestor } from '../../../redux/shell/remote'
import { DeviceDetailsComponent } from './DeviceDetailsComponent'

import type { DesktopRouteParams } from '../../../App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<DesktopRouteParams>()
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
    <Redirect to="/devices" />
  )
}
