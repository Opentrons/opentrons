// @flow
import * as React from 'react'

import SystemUpdateModal from './SystemUpdateModal'
import UpdateRobotModal from './UpdateRobotModal'

import type { BuildrootStatus, ViewableRobot } from '../../../discovery'
import type { ShellUpdateState } from '../../../shell'

type Props = {
  robot: ViewableRobot,
  appUpdate: ShellUpdateState,
  parentUrl: string,
  buildrootStatus: BuildrootStatus | null,
  buildrootUpdateAvailable: boolean,
  ignoreBuildrootUpdate: () => mixed,
}

export default function UpdateBuildroot(props: Props) {
  const {
    robot,
    parentUrl,
    appUpdate,
    buildrootStatus,
    buildrootUpdateAvailable,
    ignoreBuildrootUpdate,
  } = props
  if (buildrootStatus === 'balena') {
    return (
      <SystemUpdateModal
        robot={robot}
        parentUrl={parentUrl}
        ignoreUpdate={ignoreBuildrootUpdate}
        buildrootUpdateAvailable={buildrootUpdateAvailable}
      />
    )
  } else if (buildrootStatus === 'buildroot') {
    return (
      <UpdateRobotModal
        robot={robot}
        parentUrl={parentUrl}
        appUpdate={appUpdate}
        buildrootUpdateAvailable={buildrootUpdateAvailable}
      />
    )
  }
  return null
}
