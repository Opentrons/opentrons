import React from 'react'
import { useSelector } from 'react-redux'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import {
  fetchCalibrationStatus,
  fetchPipetteOffsetCalibrations,
  fetchTipLengthCalibrations,
  getDeckCalibrationData,
  getPipetteOffsetCalibrations,
  getTipLengthCalibrations,
} from '../../redux/calibration'
import {
  getDiscoverableRobotByName,
  CONNECTABLE,
  REACHABLE,
} from '../../redux/discovery'
import { fetchModules, getAttachedModules } from '../../redux/modules'
import { fetchPipettes, getAttachedPipettes } from '../../redux/pipettes'
import { useDispatchApiRequest } from '../../redux/robot-api'
import {
  fetchLights,
  updateLights,
  getLightsOn,
} from '../../redux/robot-controls'

import type {
  DeckCalibrationData,
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../../redux/calibration/types'
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
  const runStatus = useCurrentRunStatus()

  // may want to adjust the condition that shows the active run - only running, paused, etc
  const isProtocolRunning = runStatus != null && runStatus !== RUN_STATUS_IDLE

  return isProtocolRunning
}

export function useIsRobotViewable(robotName: string): boolean {
  const robot = useRobot(robotName)

  return robot?.status === CONNECTABLE || robot?.status === REACHABLE
}

export function useDeckCalibrationData(
  robotName: string | null = null
): DeckCalibrationData | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const deckCalibrationData = useSelector((state: State) =>
    getDeckCalibrationData(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchCalibrationStatus(robotName))
    }
  }, [dispatchRequest, robotName])

  return deckCalibrationData
}

export function usePipetteOffsetCalibrations(
  robotName: string | null = null
): PipetteOffsetCalibration[] | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const pipetteOffsetCalibrations = useSelector((state: State) =>
    getPipetteOffsetCalibrations(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
    }
  }, [dispatchRequest, robotName])

  return pipetteOffsetCalibrations
}

export function useTipLengthCalibrations(
  robotName: string | null = null
): TipLengthCalibration[] | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const tipLengthCalibrations = useSelector((state: State) =>
    getTipLengthCalibrations(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchTipLengthCalibrations(robotName))
    }
  }, [dispatchRequest, robotName])

  return tipLengthCalibrations
}
