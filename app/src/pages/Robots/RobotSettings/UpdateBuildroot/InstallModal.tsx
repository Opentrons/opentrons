import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { InstallModalContents } from './InstallModalContents'

import type { ViewableRobot } from '../../../../redux/discovery/types'
import type {
  BuildrootUpdateSession,
  RobotSystemType,
} from '../../../../redux/buildroot/types'

export interface InstallModalProps {
  robot: ViewableRobot
  robotSystemType: RobotSystemType | null
  session: BuildrootUpdateSession
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
  if (robotSystemType === 'balena') {
    if (
      session.step === 'premigration' ||
      session.step === 'premigrationRestart'
    ) {
      heading = 'Robot Update: Step 1 of 2'
    } else {
      heading = 'Robot Update: Step 2 of 2'
    }
  } else if (robotSystemType === 'buildroot') {
    heading = 'Robot Update'
  }

  return (
    <AlertModal
      // @ts-expect-error use commented code above
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
