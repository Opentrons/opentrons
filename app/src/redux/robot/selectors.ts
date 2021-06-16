// robot selectors
import { head } from 'lodash'
import some from 'lodash/some'
import uniqBy from 'lodash/uniqBy'
import { createSelector } from 'reselect'

import type { ModuleModel, PipetteModel } from '@opentrons/shared-data'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { getCustomLabwareDefinitions } from '../custom-labware/selectors'
import { getLabwareDefBySlot } from '../protocol/selectors'
import { getLatestLabwareDef } from '../../assets/labware/getLabware'
import * as Constants from './constants'

import type { State } from '../types'
import type {
  Command,
  CommandNode,
  ConnectionStatus,
  Labware,
  LabwareCalibrationStatus,
  LabwareType,
  Mount,
  NextTiprackPipetteInfo,
  Pipette,
  SessionModule,
  SessionStatus,
  SessionStatusInfo,
  Slot,
  StateLabware,
  StatePipette,
  TipracksByMountMap,
} from './types'

import type { ConnectionState } from './reducer/connection'
import type {
  CalibrationRequest,
  CalibrationState,
} from './reducer/calibration'
import type { Request, SessionState } from './reducer/session'

const calibration = (state: State): CalibrationState => state.robot.calibration
const connection = (state: State): ConnectionState => state.robot.connection
const session = (state: State): SessionState => state.robot.session
const sessionRequest = (state: State): Request => session(state).sessionRequest
const cancelRequest = (state: State): Request => session(state).cancelRequest

export function isMount(target: string | null | undefined): boolean {
  return Constants.PIPETTE_MOUNTS.includes(target as Mount)
}

export function isSlot(target: string | null | undefined): boolean {
  return Constants.DECK_SLOTS.includes(target as Slot)
}

export function labwareType(labware: Labware): LabwareType {
  return labware.isTiprack ? 'tiprack' : 'labware'
}

export function getConnectRequest(
  state: State
): ConnectionState['connectRequest'] {
  return connection(state).connectRequest
}

export function getConnectedRobotName(state: State): string | null {
  return connection(state).connectedTo || null
}

export const getConnectionStatus: (
  state: State
) => ConnectionStatus = createSelector(
  getConnectedRobotName,
  state => getConnectRequest(state).inProgress,
  state => connection(state).disconnectRequest.inProgress,
  state => connection(state).unexpectedDisconnect,
  (connectedTo, isConnecting, isDisconnecting, unexpectedDisconnect) => {
    if (unexpectedDisconnect) return Constants.DISCONNECTED
    if (!connectedTo && isConnecting) return Constants.CONNECTING
    if (connectedTo && !isDisconnecting) return Constants.CONNECTED
    if (connectedTo && isDisconnecting) return Constants.DISCONNECTING

    return Constants.DISCONNECTED
  }
)

export function getSessionCapabilities(state: State): string[] {
  return session(state).capabilities
}

export function getSessionLoadInProgress(state: State): boolean {
  return sessionRequest(state).inProgress
}

export function getUploadError(
  state: State
): { message: string; [key: string]: unknown } | null | undefined {
  return sessionRequest(state).error
}

export function getSessionStatus(state: State): SessionStatus {
  return session(state).state
}

export function getSessionStatusInfo(state: State): SessionStatusInfo {
  return session(state).statusInfo
}

export function getSessionIsLoaded(state: State): boolean {
  return getSessionStatus(state) !== ('' as SessionStatus)
}

export function getIsReadyToRun(state: State): boolean {
  return getSessionStatus(state) === ('loaded' as SessionStatus)
}

export function getIsRunning(state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('running' as SessionStatus) ||
    status === ('paused' as SessionStatus)
  )
}

export function getIsPaused(state: State): boolean {
  return getSessionStatus(state) === ('paused' as SessionStatus)
}

export function getIsBlocked(state: State): boolean {
  return session(state).blocked
}

export function getCancelInProgress(state: State): boolean {
  return cancelRequest(state).inProgress
}

export function getIsDone(state: State): boolean {
  const status = getSessionStatus(state)

  return (
    status === ('error' as SessionStatus) ||
    status === ('finished' as SessionStatus) ||
    status === ('stopped' as SessionStatus)
  )
}

// helper function for getCommands selector
function traverseCommands(
  commandsById: Record<number, Command>,
  parentIsCurrent: boolean
): (id: number, index: number, commands: number[]) => CommandNode {
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

export const getCommands: (state: State) => CommandNode[] = createSelector(
  (state: State) => session(state).protocolCommands,
  (state: State) => session(state).protocolCommandsById,
  (commands, commandsById) => commands.map(traverseCommands(commandsById, true))
)

export const getRunProgress: (state: State) => number = createSelector(
  getCommands,
  (commands): number => {
    const leaves = commands.reduce(countLeaves, { handled: 0, total: 0 })

    return leaves.total && (leaves.handled / leaves.total) * 100

    function countLeaves(
      result: { handled: number; total: number },
      command: CommandNode
    ): { handled: number; total: number } {
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

export const getSessionError: (state: State) => string | null = createSelector(
  (state: State) => session(state).runRequest.error,
  (state: State) => session(state).errors,
  (runError, sessionErrors) => {
    if (runError) return runError.message
    if (sessionErrors.length > 0) return sessionErrors[0].message
    return null
  }
)

export const getStartTimeMs = (state: State): number | null => {
  const { startTime } = session(state)

  if (startTime == null) {
    return null
  }

  return startTime
}

function millisToSeconds(ms: number): number {
  return Math.floor(Math.max(0, ms) / 1000)
}

export function getRunSeconds(state: State, now: number = Date.now()): number {
  const isRunning = getIsRunning(state)
  if (isRunning) {
    const startTimeMs = getStartTimeMs(state)
    if (startTimeMs == null) {
      return 0
    }
    return millisToSeconds(now - startTimeMs)
  }
  const isDone = getIsDone(state)
  if (isDone) {
    const statusInfo = getSessionStatusInfo(state)
    if (statusInfo.changedAt == null) {
      return 0
    }
    return millisToSeconds(statusInfo.changedAt)
  }
  return 0
}

/**
 * Same considerations as commented above for `getRunSecondsAt`
 */
export function getPausedSeconds(
  state: State,
  now: number = Date.now()
): number {
  const isPaused = getIsPaused(state)
  if (isPaused) {
    const startTimeMs = getStartTimeMs(state)
    const statusInfo = getSessionStatusInfo(state)
    if (startTimeMs != null && statusInfo.changedAt != null) {
      return millisToSeconds(now - startTimeMs - statusInfo.changedAt)
    }
  }
  return 0
}

export function getCalibrationRequest(state: State): CalibrationRequest {
  return calibration(state).calibrationRequest
}

export function getPipettesByMount(
  state: State
): { [mount in Mount]?: StatePipette } {
  return session(state).pipettesByMount
}

export const getPipettes: (state: State) => Pipette[] = createSelector(
  getPipettesByMount,
  (state: State): { [mount in Mount]?: boolean } =>
    calibration(state).probedByMount,
  (state: State) => calibration(state).tipOnByMount,
  (
    pipettesByMount: { [mount in Mount]?: StatePipette },
    probedByMount: { [mount in Mount]?: boolean },
    tipOnByMount: { [mount in Mount]?: boolean }
  ): Pipette[] => {
    return Constants.PIPETTE_MOUNTS.filter(
      (mount: Mount) => pipettesByMount[mount] != null
    ).map(mount => {
      const pipette = pipettesByMount[mount] as StatePipette
      const probed = probedByMount[mount] || false
      const tipOn = tipOnByMount[mount] || false

      const fullPipette: Pipette = {
        ...pipette,
        probed,
        tipOn,
        modelSpecs: getPipetteModelSpecs(pipette?.name as PipetteModel) || null,
        requestedAs: pipette?.requestedAs || null,
      }
      return fullPipette
    })
  }
)

export function getApiLevel(state: State): [number, number] | null {
  return session(state).apiLevel
}

export const getNextPipette: (state: State) => Pipette | null = createSelector(
  getPipettes,
  (pipettes): Pipette | null => {
    const usedPipettes = pipettes.filter(p => p.tipRacks.length > 0)
    const nextPipette = usedPipettes.find(i => !i.probed)

    return nextPipette || usedPipettes[0] || null
  }
)

// returns the mount of the pipette to use for labware calibration
// TODO(mc, 2018-02-07): be smarter about the backup case
export const getCalibrator: (
  state: State
) => Pipette | undefined = createSelector(
  getPipettes,
  pipettes => pipettes.find(i => i.tipOn) ?? pipettes[0]
)

// TODO(mc, 2018-02-07): remove this selector in favor of the one above
export function getCalibratorMount(state: State): Mount | null | undefined {
  const calibrator: Pipette | undefined = getCalibrator(state)

  if (!calibrator) return null

  return calibrator.mount
}

export const getPipettesCalibrated: (state: State) => boolean = createSelector(
  getPipettes,
  pipettes => pipettes.length !== 0 && pipettes.every(i => i.probed)
)

export function getModulesBySlot(
  state: State
): { [slot in Slot]?: SessionModule } {
  return session(state).modulesBySlot
}

export const getModules: (state: State) => SessionModule[] = createSelector(
  getModulesBySlot,
  modulesBySlot =>
    Object.keys(modulesBySlot)
      .map<SessionModule | undefined>(
        (slot: string) => modulesBySlot[slot as keyof typeof modulesBySlot]
      )
      .filter<SessionModule>(
        (s: SessionModule | undefined): s is SessionModule => s !== undefined
      )
)

export const getModulesByProtocolLoadOrder: (
  state: State
) => SessionModule[] = createSelector(getModules, modules =>
  modules.slice().sort((a, b) => a.protocolLoadOrder - b.protocolLoadOrder)
)

export const getModulesByModel: (
  state: State
) => {
  [model in ModuleModel]?: SessionModule[]
} = createSelector(getModules, modules => {
  return modules.reduce<{ [model in ModuleModel]?: SessionModule[] }>(
    (acc, val) => {
      if (!acc[val.model]) {
        acc[val.model] = []
      }
      acc[val.model]?.push(val)
      return acc
    },
    {}
  )
})

export function getLabwareBySlot(
  state: State
): { [key in Slot]?: StateLabware } {
  return session(state).labwareBySlot
}

export const getLabware: (state: State) => Labware[] = createSelector(
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
      .map(slot => {
        const labware = lwBySlot[slot as Slot] as Labware
        const { type, isTiprack, isLegacy } = labware ?? {}

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
          (value: boolean | undefined, key: string) =>
            value === true &&
            (key === slot ||
              (!isTiprack &&
                type === lwBySlot[key as Slot]?.type &&
                modulesBySlot[key as Slot]?.model ===
                  modulesBySlot[slot as Slot]?.model))
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

        const fullLabware: Labware = {
          ...labware,
          calibration,
          confirmed,
          isMoving,
          definition,
        }
        return fullLabware
      })
      .sort((a, b) => {
        if (a.isTiprack && !b.isTiprack) return -1
        if (!a.isTiprack && b.isTiprack) return 1
        if (!a.isTiprack && !b.isTiprack) return 0

        // both a and b are tipracks, sort multi-channel calibrators first
        const aChannels: number =
          a.calibratorMount != null
            ? instByMount[a.calibratorMount as Mount]?.channels ?? 0
            : 0
        const bChannels: number =
          b.calibratorMount != null
            ? instByMount[b.calibratorMount as Mount]?.channels ?? 0
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

export const getUnconfirmedLabware: (
  state: State
) => Labware[] = createSelector(getLabware, labware =>
  labware.filter(lw => lw.type && !lw.confirmed)
)

export const getTipracks: (
  state: State
) => Labware[] = createSelector(getLabware, labware =>
  labware.filter(lw => lw.type && lw.isTiprack)
)

export const getNotTipracks: (
  state: State
) => Labware[] = createSelector(getLabware, labware =>
  labware.filter(lw => lw.type && !lw.isTiprack)
)

export const getUnconfirmedTipracks: (
  state: State
) => Labware[] = createSelector(getUnconfirmedLabware, labware =>
  labware.filter(lw => lw.type && lw.isTiprack)
)

export const getNextLabware: (
  state: State
) => Labware | null | undefined = createSelector(
  getUnconfirmedTipracks,
  getUnconfirmedLabware,
  (tipracks, labware) => tipracks[0] ?? labware[0]
)

export const getTipracksConfirmed: (state: State) => boolean = createSelector(
  getUnconfirmedTipracks,
  remaining => remaining.length === 0
)

export const getLabwareConfirmed: (state: State) => boolean = createSelector(
  getUnconfirmedLabware,
  remaining => remaining.length === 0
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
) => TipracksByMountMap = createSelector(
  getTipracks,
  getPipettesByMount,
  (tipracks, pipettesMap) => {
    return Constants.PIPETTE_MOUNTS.reduce<TipracksByMountMap>(
      (tiprackMap, mount) => {
        const byCalibrator = tipracks.filter(tr => tr.calibratorMount === mount)
        const byTiprackList = tipracks.filter(tr =>
          (pipettesMap[mount]?.tipRacks ?? []).includes(tr._id)
        )

        tiprackMap[mount] = uniqBy(
          byCalibrator.concat(byTiprackList),
          item => item.definitionHash ?? item._id
        )
        return tiprackMap
      },
      { left: [], right: [] }
    )
  }
)

export const getNextTiprackPipette: (
  uncalibratedTipracksByMount: TipracksByMountMap
) => NextTiprackPipetteInfo | null = uncalibratedTipracksByMount => {
  const targetMount = head(
    Constants.PIPETTE_MOUNTS.filter(
      mount => uncalibratedTipracksByMount[mount].length > 0
    )
  )
  if (targetMount) {
    return {
      mount: targetMount,
      tiprack: uncalibratedTipracksByMount[targetMount][0],
    }
  } else {
    return null
  }
}
