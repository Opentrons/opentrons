// @flow
import * as React from 'react'

import UpdateRobotModal from './UpdateRobotModal'
import ViewUpdateModal from './ViewUpdateModal'
import InstallModal from './InstallModal'

import type { ViewableRobot } from '../../../discovery'
import type { ShellUpdateState } from '../../../shell'

type Props = {
  robot: ViewableRobot,
  appUpdate: ShellUpdateState,
  parentUrl: string,
  ignoreBuildrootUpdate: () => mixed,
}

export default function UpdateBuildroot(props: Props) {
  const [currentStep, setCurrentStep] = React.useState<string>(
    'versionMismatch'
  )
  const { robot, parentUrl, appUpdate, ignoreBuildrootUpdate } = props
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
    return (
      <ViewUpdateModal
        robot={robot}
        parentUrl={parentUrl}
        setCurrentStep={setCurrentStep}
      />
    )
  } else if (currentStep === 'installUpdate') {
    return (
      <InstallModal
        parentUrl={parentUrl}
        ignoreUpdate={ignoreBuildrootUpdate}
      />
    )
  }
  return null
}
