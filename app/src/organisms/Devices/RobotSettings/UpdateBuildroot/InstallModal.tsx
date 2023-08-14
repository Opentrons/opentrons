import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { InstallModalContents } from './InstallModalContents'

import type { ViewableRobot } from '../../../../redux/discovery/types'
import type {
  RobotUpdateSession,
  RobotSystemType,
} from '../../../../redux/robot-update/types'
import { OT2_BALENA } from '../../../../redux/robot-update'

export interface InstallModalProps {
  robot: ViewableRobot
  robotSystemType: RobotSystemType | null
  session: RobotUpdateSession
  close: () => unknown
}

export function InstallModal(props: InstallModalProps): JSX.Element {
  const { session, close, robotSystemType } = props
  const buttons = []

  if (session.step === 'finished' || session.error !== null) {
    buttons.push({ children: 'close', onClick: close })
  }

  let heading: string
  // let heading: string = ''
  if (robotSystemType === OT2_BALENA) {
    if (
      session.step === 'premigration' ||
      session.step === 'premigrationRestart'
    ) {
      heading = 'Robot Update: Step 1 of 2'
    } else {
      heading = 'Robot Update: Step 2 of 2'
    }
  } else {
    heading = 'Robot Update'
  }

  return (
    <AlertModal
      heading={heading}
      buttons={buttons}
      restrictOuterScroll={false}
      alertOverlay
    >
      <InstallModalContents
        robotSystemType={robotSystemType}
        session={session}
      />
    </AlertModal>
  )
}
