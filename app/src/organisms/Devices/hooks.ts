import React from 'react'
import { useSelector } from 'react-redux'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { useCurrentRun } from '../../organisms/ProtocolUpload/hooks'
import { getDiscoverableRobotByName } from '../../redux/discovery'
import { fetchModules, getAttachedModules } from '../../redux/modules'
import { fetchPipettes, getAttachedPipettes } from '../../redux/pipettes'
import { useDispatchApiRequest } from '../../redux/robot-api'
import {
  fetchLights,
  updateLights,
  getLightsOn,
} from '../../redux/robot-controls'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { AttachedModule } from '../../redux/modules/types'
import type { AttachedPipettesByMount } from '../../redux/pipettes/types'
import type { State } from '../../redux/types'

export function useAttachedModules(robotName: string | null): AttachedModule[] {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchModules(robotName))
    }
  }, [dispatchRequest, robotName])

  return attachedModules
}

export function useAttachedPipettes(
  robotName: string | null
): AttachedPipettesByMount {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedPipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipettes(robotName))
    }
  }, [dispatchRequest, robotName])

  return attachedPipettes
}

export function useRobot(robotName: string): DiscoveredRobot | null {
  const robot = useSelector((state: State) =>
    getDiscoverableRobotByName(state, robotName)
  )

  return robot
}

export function useLights(
  robotName: string
): { lightsOn: boolean | null; toggleLights: () => void } {
  const [dispatchRequest] = useDispatchApiRequest()

  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))

  const toggleLights = (): void => {
    dispatchRequest(updateLights(robotName, !lightsOn))
  }

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchLights(robotName))
    }
  }, [dispatchRequest, robotName])

  return { lightsOn, toggleLights }
}

export function useIsProtocolRunning(): boolean {
  const runRecord = useCurrentRun()

  // may want to adjust the condition that shows the active run - only running, paused, etc
  const isProtocolRunning =
    runRecord != null && runRecord.data.status !== RUN_STATUS_IDLE

  return isProtocolRunning
}
