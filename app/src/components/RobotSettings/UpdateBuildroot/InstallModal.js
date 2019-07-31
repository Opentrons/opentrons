// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { AlertModal } from '@opentrons/components'
import InstallModalContents from './InstallModalContents'
import { clearBuildrootSession } from '../../../shell'

import type { Dispatch } from '../../../types'
import type { ViewableRobot } from '../../../discovery'
import type { BuildrootUpdateSession, RobotSystemType } from '../../../shell'

type Props = {|
  robot: ViewableRobot,
  robotSystemType: RobotSystemType | null,
  session: BuildrootUpdateSession,
  close: () => mixed,
|}

export default function InstallModal(props: Props) {
  const { session, close, robotSystemType } = props
  const dispatch = useDispatch<Dispatch>()
  const buttons = []

  if (session.step === 'finished' || session.error) {
    buttons.push({
      children: 'close',
      onClick: () => {
        close()
        dispatch(clearBuildrootSession())
      },
    })
  }

  let heading: string
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
      heading={heading}
      buttons={buttons}
      restrictOuterScroll={false}
      alertOverlay
    >
      <InstallModalContents {...props} />
    </AlertModal>
  )
}
