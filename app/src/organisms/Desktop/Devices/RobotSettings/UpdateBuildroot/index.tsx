import { useRef, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { ApiHostProvider } from '@opentrons/react-api-client'

import {
  setRobotUpdateSeen,
  robotUpdateIgnored,
  getRobotUpdateSession,
} from '/app/redux/robot-update'
import { ViewUpdateModal } from './ViewUpdateModal'
import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'
import { UNREACHABLE, OPENTRONS_USB } from '/app/redux/discovery'
import { appShellRequestor } from '/app/redux/shell/remote'

import type { Dispatch } from '/app/redux/types'
import type { DiscoveredRobot } from '/app/redux/discovery/types'

interface UpdateBuildrootProps {
  robot: DiscoveredRobot | null
}

export const handleUpdateBuildroot = (
  robot: UpdateBuildrootProps['robot']
): void => {
  NiceModal.show(UpdateBuildroot, { robot })
}

const UpdateBuildroot = NiceModal.create(
  (props: UpdateBuildrootProps): JSX.Element | null => {
    const { robot } = props
    const hasSeenSessionOnce = useRef<boolean>(false)
    const modal = useModal()
    const robotName = useRef<string>(robot?.name ?? '')
    const dispatch = useDispatch<Dispatch>()
    const session = useSelector(getRobotUpdateSession)
    if (!hasSeenSessionOnce.current && session)
      hasSeenSessionOnce.current = true

    useEffect(() => {
      if (robotName.current) {
        dispatch(setRobotUpdateSeen(robotName.current))
      }
    }, [robotName])

    const ignoreUpdate = useCallback(() => {
      if (robotName.current) {
        dispatch(robotUpdateIgnored(robotName.current))
      }
      modal.remove()
    }, [robotName, close])

    if (hasSeenSessionOnce.current)
      return (
        <ApiHostProvider
          hostname={robot?.ip ?? null}
          port={robot?.port ?? null}
          requestor={
            robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
          }
        >
          <RobotUpdateProgressModal
            robotName={robotName.current}
            session={session}
            closeUpdateBuildroot={modal.remove}
          />
        </ApiHostProvider>
      )
    else if (robot != null && robot.status !== UNREACHABLE)
      return (
        <ViewUpdateModal
          robotName={robotName.current}
          robot={robot}
          closeModal={ignoreUpdate}
        />
      )
    else return null
  }
)
