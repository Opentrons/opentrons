// robot selectors
  // TODO(mc, 2017-08-30): memoize with reselect
import padStart from 'lodash/padStart'

import {
  _NAME,
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  DISCONNECTING,
  LOADED,
  RUNNING,
  PAUSED,
  ERROR,
  FINISHED,
  STOPPED,
  UNPROBED,
  UNCONFIRMED,
  INSTRUMENT_AXES,
  DECK_SLOTS,
  SINGLE_CHANNEL,
  MULTI_CHANNEL
} from './constants'

const getState = (state) => state[_NAME]
const getConnectionState = (state) => getState(state).connection
const getSessionState = (state) => getState(state).session
const getCalibrationState = (state) => getState(state).calibration

export function getIsScanning (state) {
  return getConnectionState(state).isScanning
}

export function getDiscovered (state) {
  const {
    discovered,
    discoveredByHost,
    connectedTo
  } = getConnectionState(state)

  return discovered.map((host) => ({
    ...discoveredByHost[host],
    isConnected: connectedTo === host
  }))
}

export function getConnectionStatus (state) {
  const {
    connectedTo,
    connectRequest: {inProgress: isConnecting},
    disconnectRequest: {inProgress: isDisconnecting}
  } = getConnectionState(state)

  if (!connectedTo && isConnecting) return CONNECTING
  if (connectedTo && !isDisconnecting) return CONNECTED
  if (connectedTo && isDisconnecting) return DISCONNECTING

  return DISCONNECTED
}

export function getUploadInProgress (state) {
  return getSessionState(state).sessionRequest.inProgress
}

export function getUploadError (state) {
  return getSessionState(state).sessionRequest.error
}

export function getSessionName (state) {
  return getSessionState(state).name
}

export function getSessionIsLoaded (state) {
  return !!getSessionState(state).state
}

export function getIsReadyToRun (state) {
  return getSessionState(state).state === LOADED
}

export function getIsRunning (state) {
  const sessionState = getSessionState(state).state

  return (
    sessionState === RUNNING ||
    sessionState === PAUSED
  )
}

export function getIsPaused (state) {
  return getSessionState(state).state === PAUSED
}

export function getIsDone (state) {
  const sessionState = getSessionState(state).state

  return (
    sessionState === ERROR ||
    sessionState === FINISHED ||
    sessionState === STOPPED
  )
}

export function getCommands (state) {
  const {
    protocolCommands,
    protocolCommandsById
  } = getSessionState(state)

  return protocolCommands.map(idToCommandList(true))

  function idToCommandList (parentIsCurrent) {
    return function mapIdToCommand (id, index, commands) {
      const command = protocolCommandsById[id]
      const next = protocolCommandsById[commands[index + 1]]
      const isCurrent = (
        parentIsCurrent &&
        command.handledAt &&
        (!next || !next.handledAt)
      ) || false
      const isLast = isCurrent && !command.children.length
      const children = command.children.map(idToCommandList(isCurrent))

      return {...command, children, isCurrent, isLast}
    }
  }
}

export function getRunProgress (state) {
  const leaves = getCommands(state).reduce(countLeaves, {handled: 0, total: 0})

  if (!leaves.total) return 0

  return 100 * (leaves.handled / leaves.total)

  function countLeaves (result, cmd) {
    if (cmd.children.length) return cmd.children.reduce(countLeaves, result)
    if (cmd.handledAt) result.handled++
    result.total++

    return result
  }
}

export function getStartTime (state) {
  const commands = getCommands(state)

  if (!commands.length) return ''
  return commands[0].handledAt
}

export function getRunTime (state) {
  const {runTime} = getSessionState(state)
  const startTime = getStartTime(state)
  const runTimeSeconds = (runTime && startTime)
    ? Math.floor((runTime - Date.parse(startTime)) / 1000)
    : 0

  const hours = padStart(Math.floor(runTimeSeconds / 3600), 2, '0')
  const minutes = padStart(Math.floor(runTimeSeconds / 60) % 60, 2, '0')
  const seconds = padStart(runTimeSeconds % 60, 2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export function getInstrumentsByAxis (state) {
  return getSessionState(state).protocolInstrumentsByAxis
}

export function getInstruments (state) {
  const protocolInstrumentsByAxis = getInstrumentsByAxis(state)
  const {
    instrumentsByAxis: calibrationByAxis,
    probedByAxis
  } = getCalibrationState(state)

  return INSTRUMENT_AXES.map((axis) => {
    let instrument = protocolInstrumentsByAxis[axis] || {axis}

    if (instrument.channels === 1) {
      instrument = {...instrument, channels: SINGLE_CHANNEL}
    } else if (instrument.channels > 1) {
      instrument = {...instrument, channels: MULTI_CHANNEL}
    }

    if (instrument.name) {
      instrument = {
        ...instrument,
        calibration: calibrationByAxis[axis] || UNPROBED,
        probed: probedByAxis[axis] || false
      }
    }

    return instrument
  })
}

export function getSingleChannel (state) {
  return getInstruments(state)
    .find((instrument) => instrument.channels === SINGLE_CHANNEL)
}

export function getInstrumentsCalibrated (state) {
  const instruments = getInstruments(state)

  return instruments
    .every((i) => i.name == null || i.probed)
}

export function getLabwareBySlot (state) {
  return getSessionState(state).protocolLabwareBySlot
}

export function getLabware (state) {
  const protocolLabwareBySlot = getLabwareBySlot(state)
  const {
    confirmedBySlot,
    labwareBySlot: calibrationBySlot
  } = getCalibrationState(state)

  return DECK_SLOTS.map((slot) => {
    let labware = protocolLabwareBySlot[slot] || {slot}

    if (labware.name) {
      labware = {
        ...labware,
        calibration: calibrationBySlot[slot] || UNCONFIRMED,
        confirmed: confirmedBySlot[slot] || false
      }
    }

    return labware
  })
}

export function getLabwareReviewed (state) {
  return getCalibrationState(state).labwareReviewed
}

export function getUnconfirmedLabware (state) {
  return getLabware(state).filter((lw) => (lw.type != null && !lw.confirmed))
}

export function getUnconfirmedTipracks (state) {
  return getUnconfirmedLabware(state).filter((lw) => lw.isTiprack)
}

export function getNextLabware (state) {
  return getUnconfirmedTipracks(state)[0] || getUnconfirmedLabware(state)[0]
}

export function getTipracksConfirmed (state) {
  return getUnconfirmedTipracks(state).length === 0
}

export function getLabwareConfirmed (state) {
  return getUnconfirmedLabware(state).length === 0
}

export function getJogInProgress (state) {
  return getCalibrationState(state).jogRequest.inProgress
}

export function getOffsetUpdateInProgress (state) {
  return getCalibrationState(state).updateOffsetRequest.inProgress
}
