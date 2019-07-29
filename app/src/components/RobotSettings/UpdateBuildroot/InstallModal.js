// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { AlertModal } from '@opentrons/components'
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
  const { session, close } = props
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

  return (
    <AlertModal
      heading="Modal not implemented"
      buttons={buttons}
      restrictOuterScroll={false}
      alertOverlay
    >
      <p>{JSON.stringify(session, null, 2)}</p>
    </AlertModal>
  )
}
