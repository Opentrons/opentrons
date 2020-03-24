// @flow
// robot selectors
import padStart from 'lodash/padStart'
import some from 'lodash/some'
import { createSelector } from 'reselect'
import { format } from 'date-fns'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { getLatestLabwareDef } from '../getLabware'
import { PIPETTE_MOUNTS, DECK_SLOTS } from './constants'
import { getLabwareDefBySlot } from '../protocol/selectors'
import { getCustomLabwareDefinitions } from '../custom-labware/selectors'

import type { OutputSelector } from 'reselect'
import type { State } from '../types'
import type { ConnectionStatus } from './constants'
import type {
  Mount,
  Slot,
  Pipette,
  Labware,
  LabwareCalibrationStatus,
  LabwareType,
  SessionStatus,
  SessionModule,
  TiprackByMountMap,
} from './types'

const calibration = (state: State) => state.robot.calibration
const connection = (state: State) => state.robot.connection
const session = (state: State) => state.robot.session
const sessionRequest = (state: State) => session(state).sessionRequest
const cancelRequest = (state: State) => session(state).cancelRequest

export function isMount(target: ?string): boolean {
  return PIPETTE_MOUNTS.indexOf(target) > -1
}

export function isSlot(target: ?string): boolean {
  return DECK_SLOTS.indexOf(target) > -1
}

export function labwareType(labware: Labware): LabwareType {
  return labware.isTiprack ? 'tiprack' : 'labware'
}

export function getConnectRequest(state: State) {
  return connection(state).connectRequest
}

export function getConnectedRobotName(state: State): string | null {
  return connection(state).connectedTo || null
}

export const getConnectionStatus: OutputSelector<
  State,
  void,
  ConnectionStatus
> = createSelector(
  getConnectedRobotName,
  state => getConnectRequest(state).inProgress,
  state => connection(state).disconnectRequest.inProgress,
  state => connection(state).unexpectedDisconnect,
  (connectedTo, isConnecting, isDisconnecting, unexpectedDisconnect) => {
    if (unexpectedDisconnect) return 'disconnected'
    if (!connectedTo && isConnecting) return 'connecting'
    if (connectedTo && !isDisconnecting) return 'connected'
    if (connectedTo && isDisconnecting) return 'disconnecting'

    return 'disconnected'
  }
)

export function getSessionCapabilities(state: State): Array<string> {
  return session(state).capabilities
}

export function getSessionLoadInProgress(state: State): boolean {
  return sessionRequest(state).inProgress
}

export function getUploadError(state: State): ?{ message: string } {
  return sessionRequest(state).error
}

export function getSessionStatus(state: State): SessionStatus {
  return session(state).state
}

export function getSessionIsLoaded(state: State): boolean {
  return getSessionStatus(state) !== ('': SessionStatus)
}

export function getIsReadyToRun(state: State): boolean {
  return getSessionStatus(state) === ('loaded': SessionStatus)
}

export function getIsRunning(state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('running': SessionStatus) ||
    status === ('paused': SessionStatus)
  )
}

export function getIsPaused(state: State): boolean {
  return getSessionStatus(state) === ('paused': SessionStatus)
}

export function getCancelInProgress(state: State) {
  return cancelRequest(state).inProgress
}

export function getIsDone(state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('error': SessionStatus) ||
    status === ('finished': SessionStatus) ||
    status === ('stopped': SessionStatus)
  )
}

// helper function for getCommands selector
function traverseCommands(commandsById, parentIsCurrent) {
  return function mapIdToCommand(id, index, commands) {
    const { description, handledAt, children } = commandsById[id]
    const next = commandsById[commands[index + 1]]
    const isCurrent =
      parentIsCurrent &&
      handledAt != null &&
      (next == null || next.handledAt == null)
    const isLast = isCurrent && !children.length

    return {
      id,
      description,
      handledAt,
      isCurrent,
      isLast,
      children: children.map(traverseCommands(commandsById, isCurrent)),
    }
  }
}

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getCommands = createSelector(
  (state: State) => session(state).protocolCommands,
  (state: State) => session(state).protocolCommandsById,
  (commands, commandsById) => commands.map(traverseCommands(commandsById, true))
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getRunProgress = createSelector(
  getCommands,
  (commands): number => {
    const leaves = commands.reduce(countLeaves, { handled: 0, total: 0 })

    return leaves.total && (leaves.handled / leaves.total) * 100

    function countLeaves(result, command) {
      let { handled, total } = result

      if (command.children.length) {
        return command.children.reduce(countLeaves, result)
      }

      if (command.handledAt) handled++
      total++

      return { handled, total }
    }
  }
)

export const getSessionError: State => string | null = createSelector(
  (state: State) => session(state).runRequest.error,
  (state: State) => session(state).errors,
  (runError, sessionErrors) => {
    if (runError) return runError.message
    if (sessionErrors.length > 0) return sessionErrors[0].message
    return null
  }
)

const getStartTimeMs = (state: State): number | null => {
  const { startTime, remoteTimeCompensation } = session(state)

  if (startTime == null || remoteTimeCompensation === null) {
    return null
  }

  return startTime + remoteTimeCompensation
}

export const getStartTime: (state: State) => string | null = createSelector(
  getStartTimeMs,
  startTimeMs => {
    return startTimeMs !== null ? format(startTimeMs, 'pp') : null
  }
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getRunSeconds = createSelector(
  getStartTimeMs,
  (state: State) => session(state).runTime,
  (startTime: ?number, runTime: ?number): number => {
    return runTime && startTime && runTime > startTime
      ? Math.floor((runTime - startTime) / 1000)
      : 0
  }
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getRunTime = createSelector(
  getRunSeconds,
  (runSeconds): string => {
    const hours = padStart(`${Math.floor(runSeconds / 3600)}`, 2, '0')
    const minutes = padStart(`${Math.floor(runSeconds / 60) % 60}`, 2, '0')
    const seconds = padStart(`${runSeconds % 60}`, 2, '0')

    return `${hours}:${minutes}:${seconds}`
  }
)

export function getCalibrationRequest(state: State) {
  return calibration(state).calibrationRequest
}

export function getPipettesByMount(state: State) {
  return session(state).pipettesByMount
}

export const getPipettes: State => Array<Pipette> = createSelector(
  getPipettesByMount,
  (state: State) => calibration(state).probedByMount,
  (state: State) => calibration(state).tipOnByMount,
  (pipettesByMount, probedByMount, tipOnByMount): Array<Pipette> => {
    return PIPETTE_MOUNTS.filter(mount => pipettesByMount[mount] != null).map(
      mount => {
        const pipette = pipettesByMount[mount]
        const probed = probedByMount[mount] || false
        const tipOn = tipOnByMount[mount] || false

        return {
          ...pipette,
          probed,
          tipOn,
          modelSpecs: getPipetteModelSpecs(pipette.name) || null,
          requestedAs: pipette.requestedAs || null,
        }
      }
    )
  }
)

export function getApiLevel(state: State): [number, number] | null {
  return session(state).apiLevel
}

export const getNextPipette: State => Pipette | null = createSelector(
  getPipettes,
  (pipettes): Pipette | null => {
    const usedPipettes = pipettes.filter(p => p.tipRacks.length > 0)
    const nextPipette = usedPipettes.find(i => !i.probed)

    return nextPipette || usedPipettes[0] || null
  }
)

// returns the mount of the pipette to use for labware calibration
// TODO(mc, 2018-02-07): be smarter about the backup case
// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getCalibrator = createSelector(
  getPipettes,
  (pipettes): ?Pipette => pipettes.find(i => i.tipOn) || pipettes[0]
)

// TODO(mc, 2018-02-07): remove this selector in favor of the one above
export function getCalibratorMount(state: State): ?Mount {
  const calibrator: ?Pipette = getCalibrator(state)

  if (!calibrator) return null

  return calibrator.mount
}

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getPipettesCalibrated = createSelector(
  getPipettes,
  (pipettes): boolean => pipettes.length !== 0 && pipettes.every(i => i.probed)
)

export function getModulesBySlot(state: State): { [Slot]: SessionModule } {
  return session(state).modulesBySlot
}

export const getModules: State => Array<SessionModule> = createSelector(
  getModulesBySlot,
  // TODO (ka 2019-3-26): can't import getConfig due to circular dependency
  state => state.config,
  (modulesBySlot, config) =>
    Object.keys(modulesBySlot).map((slot: Slot) => modulesBySlot[slot])
)

export function getLabwareBySlot(state: State) {
  return session(state).labwareBySlot
}

export const getLabware: OutputSelector<
  State,
  void,
  Array<Labware>
> = createSelector(
  getPipettesByMount,
  getLabwareBySlot,
  (state: State) => calibration(state).confirmedBySlot,
  getModulesBySlot,
  getCalibrationRequest,
  getLabwareDefBySlot,
  getCustomLabwareDefinitions,
  (
    instByMount,
    lwBySlot,
    confirmedBySlot,
    modulesBySlot,
    calibrationRequest,
    labwareDefsBySlot,
    customLabwareDefs
  ): Labware[] => {
    return Object.keys(lwBySlot)
      .filter(isSlot)
      .map<Labware>((slot: Slot) => {
        const labware = lwBySlot[slot]
        const { type, isTiprack, isLegacy } = labware

        let definition = null
        if (!isLegacy) {
          // TODO(mc, 2019-11-25): this logic does not adequately address
          // labware that shares a loadName but uses a different namespace
          definition =
            labwareDefsBySlot[slot] ||
            getLatestLabwareDef(type) ||
            customLabwareDefs.find(d => d.parameters.loadName === type) ||
            null
        }

        // labware is confirmed if:
        //   - tiprack: labware in slot is confirmed
        //   - non-tiprack: labware in slot or any of same type in same
        // type of parent (e.g. slot, tempdeck, thermocycler) is confirmed
        const confirmed = some(
          confirmedBySlot,
          (value: boolean, key: Slot) =>
            value === true &&
            (key === slot ||
              (!isTiprack &&
                type === lwBySlot[key].type &&
                modulesBySlot[key]?.model === modulesBySlot[slot]?.model))
        )

        let calibration: LabwareCalibrationStatus = 'unconfirmed'
        let isMoving = false

        // TODO(mc: 2018-01-10): rethink the labware level "calibration" prop
        if (calibrationRequest.slot === slot && !calibrationRequest.error) {
          const { type, inProgress } = calibrationRequest

          // don't set isMoving for jogs because it's distracting
          isMoving = inProgress && type !== 'JOG'

          if (type === 'MOVE_TO') {
            calibration = inProgress ? 'moving-to-slot' : 'over-slot'
          } else if (type === 'JOG') {
            calibration = inProgress ? 'jogging' : 'over-slot'
          } else if (type === 'DROP_TIP_AND_HOME') {
            calibration = inProgress ? 'dropping-tip' : 'over-slot'
          } else if (type === 'PICKUP_AND_HOME') {
            calibration = inProgress ? 'picking-up' : 'picked-up'
          } else if (type === 'CONFIRM_TIPRACK' || type === 'UPDATE_OFFSET') {
            calibration = inProgress ? 'confirming' : 'confirmed'
          }
        }

        return { ...labware, calibration, confirmed, isMoving, definition }
      })
      .sort((a, b) => {
        if (a.isTiprack && !b.isTiprack) return -1
        if (!a.isTiprack && b.isTiprack) return 1
        if (!a.isTiprack && !b.isTiprack) return 0

        // both a and b are tipracks, sort multi-channel calibrators first
        const aChannels =
          a.calibratorMount != null
            ? instByMount[a.calibratorMount].channels
            : 0
        const bChannels =
          b.calibratorMount != null
            ? instByMount[b.calibratorMount].channels
            : 0

        return bChannels - aChannels
      })
  }
)

export function getModulesReviewed(state: State): boolean {
  return Boolean(calibration(state).modulesReviewed)
}

export function getDeckPopulated(state: State): boolean | null {
  const { deckPopulated } = calibration(state)
  return deckPopulated != null ? deckPopulated : null
}

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getUnconfirmedLabware = createSelector(
  getLabware,
  labware => labware.filter(lw => lw.type && !lw.confirmed)
)

export const getTipracks: State => Array<Labware> = createSelector(
  getLabware,
  labware => labware.filter(lw => lw.type && lw.isTiprack)
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getNotTipracks = createSelector(
  getLabware,
  labware => labware.filter(lw => lw.type && !lw.isTiprack)
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getUnconfirmedTipracks = createSelector(
  getUnconfirmedLabware,
  labware => labware.filter(lw => lw.type && lw.isTiprack)
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getNextLabware = createSelector(
  getUnconfirmedTipracks,
  getUnconfirmedLabware,
  (tipracks, labware) => tipracks[0] || labware[0]
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getTipracksConfirmed = createSelector(
  getUnconfirmedTipracks,
  (remaining): boolean => remaining.length === 0
)

// $FlowFixMe: (mc, 2019-04-17): untyped RPC state selector
export const getLabwareConfirmed = createSelector(
  getUnconfirmedLabware,
  (remaining): boolean => remaining.length === 0
)

export function getJogInProgress(state: State): boolean {
  const request = getCalibrationRequest(state)

  return request.type === 'JOG' && request.inProgress
}

export function getOffsetUpdateInProgress(state: State): boolean {
  const request = getCalibrationRequest(state)

  return request.type === 'UPDATE_OFFSET' && request.inProgress
}

export function getReturnTipInProgress(state: State): boolean {
  const request = getCalibrationRequest(state)

  return request.type === 'RETURN_TIP' && request.inProgress
}

// return a tiprack used by the pipette on each mount for calibration processes
export const getTipracksByMount: (
  state: State
) => TiprackByMountMap = createSelector(
  getTipracks,
  tipracks => ({
    left: tipracks.find(tr => tr.calibratorMount === 'left') || null,
    right: tipracks.find(tr => tr.calibratorMount === 'right') || null,
  })
)
