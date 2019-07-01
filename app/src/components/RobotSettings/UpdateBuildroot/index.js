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
  ignoreBuildrootUpdate: () => mixed,
}

export default function UpdateBuildroot(props: Props) {
  const {
    robot,
    appUpdate,
    buildrootStatus,
    parentUrl,
    ignoreBuildrootUpdate,
  } = props
  if (buildrootStatus === 'balena') {
    return (
      <SystemUpdateModal
        ignoreUpdate={ignoreBuildrootUpdate}
        parentUrl={parentUrl}
      />
    )
  } else if (buildrootStatus === 'buildroot') {
    return <UpdateRobotModal robot={robot} appUpdate={appUpdate} />
  }
  return null
}
