// @flow
// robot selectors
import padStart from 'lodash/padStart'
import sortBy from 'lodash/sortBy'
import {createSelector, type Selector} from 'reselect'
import type {ContextRouter} from 'react-router'

import type {State} from '../types'

import type {
  Mount,
  Pipette,
  PipetteCalibrationStatus,
  Labware,
  LabwareCalibrationStatus,
  LabwareType,
  Robot,
  SessionStatus,
  SessionModule
} from './types'

import {
  type ConnectionStatus,
  _NAME,
  PIPETTE_MOUNTS,
  DECK_SLOTS
} from './constants'

const calibration = (state: State) => state[_NAME].calibration
const connection = (state: State) => state[_NAME].connection
const session = (state: State) => state[_NAME].session
const sessionRequest = (state: State) => session(state).sessionRequest
const cancelRequest = (state: State) => session(state).cancelRequest

export function isMount (target: ?string): boolean {
  return PIPETTE_MOUNTS.indexOf(target) > -1
}

export function isSlot (target: ?string): boolean {
  return DECK_SLOTS.indexOf(target) > -1
}

export function labwareType (labware: Labware): LabwareType {
  return labware.isTiprack
    ? 'tiprack'
    : 'labware'
}

export function getIsScanning (state: State): boolean {
  return connection(state).isScanning
}

export function getDiscoveredByName (state: State) {
  return connection(state).discoveredByName
}

export const getDiscovered = createSelector(
  (state: State) => connection(state).discovered,
  getDiscoveredByName,
  (state: State) => connection(state).connectedTo,
  (discovered, discoveredByName, connectedTo): Robot[] => {
    const robots = discovered.map((name) => ({
      ...discoveredByName[name],
      isConnected: connectedTo === name
    }))

    return sortBy(robots, [
      (robot) => !robot.isConnected,
      (robot) => !robot.wired,
      'name'
    ])
  }
)

export function getConnectRequest (state: State) {
  return connection(state).connectRequest
}

export function getConnectedRobotName (state: State): string {
  return connection(state).connectedTo
}

export const getConnectedRobot: Selector<State, void, ?Robot> = createSelector(
  getDiscovered,
  (discovered) => discovered.find((r) => r.isConnected)
)

export const getConnectionStatus = createSelector(
  getConnectedRobotName,
  (state: State) => getConnectRequest(state).inProgress,
  (state: State) => connection(state).disconnectRequest.inProgress,
  (connectedTo, isConnecting, isDisconnecting): ConnectionStatus => {
    if (!connectedTo && isConnecting) return 'connecting'
    if (connectedTo && !isDisconnecting) return 'connected'
    if (connectedTo && isDisconnecting) return 'disconnecting'

    return 'disconnected'
  }
)

export function getSessionLoadInProgress (state: State) {
  return sessionRequest(state).inProgress
}

export function getUploadError (state: State): ?{message: string} {
  return sessionRequest(state).error
}

export function getSessionName (state: State): string {
  return session(state).name
}

export function getSessionStatus (state: State): SessionStatus {
  return session(state).state
}

export function getSessionIsLoaded (state: State): boolean {
  return getSessionStatus(state) !== ('': SessionStatus)
}

export function getIsReadyToRun (state: State): boolean {
  return getSessionStatus(state) === ('loaded': SessionStatus)
}

export function getIsRunning (state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('running': SessionStatus) ||
    status === ('paused': SessionStatus)
  )
}

export function getIsPaused (state: State): boolean {
  return getSessionStatus(state) === ('paused': SessionStatus)
}

export function getCancelInProgress (state: State) {
  return cancelRequest(state).inProgress
}

export function getIsDone (state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('error': SessionStatus) ||
    status === ('finished': SessionStatus) ||
    status === ('stopped': SessionStatus)
  )
}

// helper function for getCommands selector
function traverseCommands (commandsById, parentIsCurrent) {
  return function mapIdToCommand (id, index, commands) {
    const {description, handledAt, children} = commandsById[id]
    const next = commandsById[commands[index + 1]]
    const isCurrent = (
      parentIsCurrent &&
      handledAt != null &&
      (next == null || next.handledAt == null)
    )
    const isLast = isCurrent && !children.length

    return {
      id,
      description,
      handledAt,
      isCurrent,
      isLast,
      children: children.map(traverseCommands(commandsById, isCurrent))
    }
  }
}

export const getCommands = createSelector(
  (state: State) => session(state).protocolCommands,
  (state: State) => session(state).protocolCommandsById,
  (commands, commandsById) => commands.map(traverseCommands(commandsById, true))
)

export const getRunProgress = createSelector(
  getCommands,
  (commands): number => {
    const leaves = commands.reduce(countLeaves, {handled: 0, total: 0})

    return leaves.total && ((leaves.handled / leaves.total) * 100)

    function countLeaves (result, command) {
      let {handled, total} = result

      if (command.children.length) {
        return command.children.reduce(countLeaves, result)
      }

      if (command.handledAt) handled++
      total++

      return {handled, total}
    }
  }
)

export function getStartTime (state: State) {
  return session(state).startTime
}

export const getRunSeconds = createSelector(
  getStartTime,
  (state: State) => session(state).runTime,
  (startTime: ?number, runTime: ?number): number => {
    return runTime && startTime && runTime > startTime
      ? Math.floor((runTime - startTime) / 1000)
      : 0
  }
)

export const getRunTime = createSelector(
  getRunSeconds,
  (runSeconds): string => {
    const hours = padStart(`${Math.floor(runSeconds / 3600)}`, 2, '0')
    const minutes = padStart(`${Math.floor(runSeconds / 60) % 60}`, 2, '0')
    const seconds = padStart(`${runSeconds % 60}`, 2, '0')

    return `${hours}:${minutes}:${seconds}`
  }
)

export function getCalibrationRequest (state: State) {
  return calibration(state).calibrationRequest
}

export function getPipettesByMount (state: State) {
  return session(state).pipettesByMount
}

export const getPipettes = createSelector(
  getPipettesByMount,
  (state: State) => calibration(state).probedByMount,
  (state: State) => calibration(state).tipOnByMount,
  (state: State) => getCalibrationRequest(state),
  (
    pipettesByMount,
    probedByMount,
    tipOnByMount,
    calibrationRequest
  ): Array<Pipette> => {
    return PIPETTE_MOUNTS
      .filter((mount) => pipettesByMount[mount] != null)
      .map((mount) => {
        const pipette = pipettesByMount[mount]

        const probed = probedByMount[mount] || false
        const tipOn = tipOnByMount[mount] || false
        let calibration: PipetteCalibrationStatus = 'unprobed'

        // TODO(mc: 2018-01-10): rethink pipette level "calibration" prop
        // TODO(mc: 2018-01-23): handle probe error state better
        if (calibrationRequest.mount === mount && !calibrationRequest.error) {
          if (calibrationRequest.type === 'MOVE_TO_FRONT') {
            calibration = calibrationRequest.inProgress
              ? 'preparing-to-probe'
              : 'ready-to-probe'
          } else if (calibrationRequest.type === 'PROBE_TIP') {
            if (calibrationRequest.inProgress) {
              calibration = 'probing'
            } else if (!probed) {
              calibration = 'probed-tip-on'
            } else {
              calibration = 'probed'
            }
          }
        }

        return {
          ...pipette,
          calibration,
          probed,
          tipOn
        }
      })
  }
)

export const getNextPipette = createSelector(
  getPipettes,
  (pipettes): ?Pipette => {
    const nextPipette = pipettes.find((i) => !i.probed)

    return nextPipette || pipettes[0]
  }
)

// returns the mount of the pipette to use for deckware calibration
// TODO(mc, 2018-02-07): be smarter about the backup case
export const getCalibrator = createSelector(
  getPipettes,
  (pipettes): ?Pipette => pipettes.find(i => i.tipOn) || pipettes[0]
)

// TODO(mc, 2018-02-07): remove this selector in favor of the one above
export function getCalibratorMount (state: State): ?Mount {
  const calibrator = getCalibrator(state)

  if (!calibrator) return null

  return calibrator.mount
}

export const getPipettesCalibrated = createSelector(
  getPipettes,
  (pipettes): boolean => (
    pipettes.length !== 0 &&
    pipettes.every((i) => i.probed)
  )
)

export function getModulesBySlot (state: State): {[string]: ?SessionModule} {
  return session(state).modulesBySlot
}

export const getModules: Selector<State, void, Array<SessionModule>> =
  createSelector(
    getModulesBySlot,
    modulesBySlot => Object
      .keys(modulesBySlot)
      .map(slot => modulesBySlot[slot])
      .filter(Boolean)
  )

export function getLabwareBySlot (state: State) {
  return session(state).labwareBySlot
}

export const getLabware = createSelector(
  getPipettesByMount,
  getLabwareBySlot,
  (state: State) => calibration(state).confirmedBySlot,
  getCalibrationRequest,
  (instByMount, lwBySlot, confirmedBySlot, calibrationRequest): Labware[] => {
    return Object.keys(lwBySlot)
      .filter(isSlot)
      .map((slot) => {
        const labware = lwBySlot[slot]
        const confirmed = confirmedBySlot[slot] || false
        let calibration: LabwareCalibrationStatus = 'unconfirmed'
        let isMoving = false

        // TODO(mc: 2018-01-10): rethink the labware level "calibration" prop
        if (calibrationRequest.slot === slot && !calibrationRequest.error) {
          const {type, inProgress} = calibrationRequest

          // don't set isMoving for jogs because it's distracting
          isMoving = inProgress && type !== 'JOG'

          if (type === 'MOVE_TO') {
            calibration = inProgress
              ? 'moving-to-slot'
              : 'over-slot'
          } else if (type === 'JOG') {
            calibration = inProgress
              ? 'jogging'
              : 'over-slot'
          } else if (type === 'DROP_TIP_AND_HOME') {
            calibration = inProgress
              ? 'dropping-tip'
              : 'over-slot'
          } else if (type === 'PICKUP_AND_HOME') {
            calibration = inProgress
              ? 'picking-up'
              : 'picked-up'
          } else if (type === 'CONFIRM_TIPRACK' || type === 'UPDATE_OFFSET') {
            calibration = inProgress
              ? 'confirming'
              : 'confirmed'
          }
        }

        return {...labware, calibration, confirmed, isMoving}
      })
      .sort((a, b) => {
        if (a.isTiprack && !b.isTiprack) return -1
        if (!a.isTiprack && b.isTiprack) return 1
        if (!a.isTiprack && !b.isTiprack) return 0

        // both a and b are tipracks, sort multi-channel calibrators first
        const aChannels = instByMount[a.calibratorMount].channels
        const bChannels = instByMount[b.calibratorMount].channels
        return bChannels - aChannels
      })
  }
)

export function getModulesReviewed (state: State) {
  return calibration(state).modulesReviewed
}

export function getDeckPopulated (state: State) {
  return calibration(state).deckPopulated
}

export const getUnconfirmedLabware = createSelector(
  getLabware,
  (labware) => labware.filter((lw) => lw.type && !lw.confirmed)
)

export const getTipracks = createSelector(
  getLabware,
  (labware) => labware.filter((lw) => lw.type && lw.isTiprack)
)

export const getNotTipracks = createSelector(
  getLabware,
  (labware) => labware.filter((lw) => lw.type && !lw.isTiprack)
)

export const getUnconfirmedTipracks = createSelector(
  getUnconfirmedLabware,
  (labware) => labware.filter((lw) => lw.type && lw.isTiprack)
)

export const getNextLabware = createSelector(
  getUnconfirmedTipracks,
  getUnconfirmedLabware,
  (tipracks, labware) => tipracks[0] || labware[0]
)

export const getTipracksConfirmed = createSelector(
  getUnconfirmedTipracks,
  (remaining): boolean => remaining.length === 0
)

export const getLabwareConfirmed = createSelector(
  getUnconfirmedLabware,
  (remaining): boolean => remaining.length === 0
)

export function getJogInProgress (state: State): boolean {
  const request = getCalibrationRequest(state)

  return request.type === 'JOG' && request.inProgress
}

export function getOffsetUpdateInProgress (state: State): boolean {
  const request = getCalibrationRequest(state)

  return request.type === 'UPDATE_OFFSET' && request.inProgress
}

// get current pipette selector factory
// to be used by a react-router Route component
export const makeGetCurrentPipette = () => createSelector(
  (_, props: ContextRouter) => props.match.params.mount,
  getPipettes,
  (mount, pipettes) => pipettes.find((i) => i.mount === mount)
)
