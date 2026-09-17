import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { UNREACHABLE } from '/app/redux/discovery'
import {
  getRobotUpdateSession,
  robotUpdateIgnored,
  setRobotUpdateSeen,
} from '/app/redux/robot-update'

import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'
import { ViewUpdateModal } from './ViewUpdateModal'

import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { Dispatch } from '/app/redux/types'

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
    if (!hasSeenSessionOnce.current && session) {
      hasSeenSessionOnce.current = true
    }

    // Dismiss so the progress modal cannot stay up with no close control.
    useEffect(() => {
      if (hasSeenSessionOnce.current && session == null) {
        modal.remove()
      }
    }, [session, modal])

    useEffect(
      () => {
        if (robotName.current) {
          dispatch(setRobotUpdateSeen(robotName.current))
        }
      },
      // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [robotName]
    )

    const ignoreUpdate = useCallback(
      () => {
        if (robotName.current) {
          dispatch(robotUpdateIgnored(robotName.current))
        }
        modal.remove()
      },
      // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [robotName, close]
    )

    if (hasSeenSessionOnce.current && session != null) {
      return (
        <ApiHostProvider robotName={robotName.current}>
          <RobotUpdateProgressModal
            robotName={robotName.current}
            session={session}
            closeRobotUpdate={modal.remove}
          />
        </ApiHostProvider>
      )
    } else if (hasSeenSessionOnce.current) {
      return null
    } else if (robot != null && robot.status !== UNREACHABLE) {
      return (
        <ViewUpdateModal
          robotName={robotName.current}
          robot={robot}
          closeModal={ignoreUpdate}
        />
      )
    } else {
      return null
    }
  }
)
