// @flow
import * as React from 'react'

import UpdateRobotModal from './UpdateRobotModal'
import ViewUpdateModal from './ViewUpdateModal'

import type { ViewableRobot } from '../../../discovery'
import type { ShellUpdateState } from '../../../shell'

type Props = {
  robot: ViewableRobot,
  appUpdate: ShellUpdateState,
  parentUrl: string,
}

export default function UpdateBuildroot(props: Props) {
  const [currentStep, setCurrentStep] = React.useState<string>(
    'versionMismatch'
  )
  const { robot, parentUrl, appUpdate } = props
  if (currentStep === 'versionMismatch') {
    return (
      <UpdateRobotModal
        robot={robot}
        parentUrl={parentUrl}
        appUpdate={appUpdate}
        setCurrentStep={setCurrentStep}
      />
    )
  } else if (currentStep === 'viewUpdateInfo') {
    return <ViewUpdateModal robot={robot} parentUrl={parentUrl} />
  }
  return null
}
