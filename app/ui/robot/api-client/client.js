// robot api client
// takes a dispatch (send) function and returns a receive handler
import RpcClient from '../../../rpc/client'
import {actions, actionTypes} from '../actions'
import {constants} from '../reducer'

// TODO(mc, 2017-08-29): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'
const RUN_TIME_TICK_INTERVAL_MS = 200

const NO_INTERVAL = -1
const RE_VOLUME = /.*?(\d+).*?/
const RE_TIPRACK = /tiprack/i
const INSTRUMENT_AXES = {
  b: 'left',
  a: 'right'
}

export default function client (dispatch) {
  let rpcClient
  let sessionManager
  let session
  let robot
  // TODO(mc, 2017-08-29): remove when server handles serial port
  let serialPort

  // TODO(mc, 2017-09-22): build some sort of timer middleware instead?
  let runTimerInterval = NO_INTERVAL

  return function receive (state, action) {
    const {type} = action

    switch (type) {
      case actionTypes.CONNECT:
        connect(state, action)
        break

      case actionTypes.DISCONNECT:
        disconnect(state, action)
        break

      case actionTypes.SESSION:
        createSession(state, action)
        break

      case actionTypes.HOME:
        home(state, action)
        break

      case actionTypes.RUN:
        run(state, action)
        break

      case actionTypes.PAUSE:
        pause(state, action)
        break

      case actionTypes.RESUME:
        resume(state, action)
        break

      case actionTypes.CANCEL:
        cancel(state, action)
        break
    }
  }

  function connect () {
    if (rpcClient) return dispatch(actions.connectResponse())

    RpcClient(URL)
      .then((c) => {
        rpcClient = c
        rpcClient
          .on('notification', handleRobotNotification)
          .on('error', handleClientError)

        sessionManager = rpcClient.remote.session_manager
        session = sessionManager.session
        robot = sessionManager.robot

        if (session) handleApiSession(session)

        return robot.get_serial_ports_list()
      })
      // TODO(mc, 2017-08-29): serial port connection should not be the
      // responsibility of the client. Remove when backend handles it
      .then((p) => {
        if (!p.length) return Promise.reject(new Error('No serial ports found'))

        serialPort = p[0]
        dispatch(actions.connectResponse())
      })
      .catch((e) => dispatch(actions.connectResponse(e)))
  }

  function disconnect () {
    if (!rpcClient) return dispatch(actions.disconnectResponse())

    rpcClient.close()
      .then(() => {
        // null out saved client and session
        rpcClient = null
        sessionManager = null
        session = null
        robot = null
        // TODO(mc, 2017-09-07): remove when server handles serial port
        serialPort = null

        clearRunTimerInterval()
        dispatch(actions.disconnectResponse())
      })
      .catch((error) => dispatch(actions.disconnectResponse(error)))
  }

  function createSession (state, action) {
    const file = action.payload.file
    const name = file.name
    const reader = new FileReader()

    reader.onload = function handleProtocolRead (event) {
      sessionManager.create(name, event.target.result)
        .then((apiSession) => {
          session = apiSession
          handleApiSession(apiSession, true)
        })
        .catch((error) => dispatch(actions.sessionResponse(error)))
    }

    return reader.readAsText(file)
  }

  function home (state, action) {
    robot.connect(serialPort)
      .then(() => robot.home())
      .then(() => robot.disconnect())
      .then(() => dispatch(actions.homeResponse()))
      .catch((error) => dispatch(actions.homeResponse(error)))
  }

  function run (state, action) {
    setRunTimerInterval()
    session.run(serialPort)
      .then(() => dispatch(actions.runResponse()))
      .catch((error) => dispatch(actions.runResponse(error)))
      .then(() => clearRunTimerInterval())
  }

  function pause (state, action) {
    session.pause()
      .then(() => dispatch(actions.pauseResponse()))
      .catch((error) => dispatch(actions.pauseResponse(error)))
  }

  function resume (state, action) {
    session.resume()
      .then(() => dispatch(actions.resumeResponse()))
      .catch((error) => dispatch(actions.resumeResponse(error)))
  }

  function cancel (state, action) {
    session.stop()
      .then(() => dispatch(actions.cancelResponse()))
      .catch((error) => dispatch(actions.cancelResponse(error)))
  }

  function setRunTimerInterval () {
    if (runTimerInterval === NO_INTERVAL) {
      runTimerInterval = setInterval(
        () => dispatch(actions.tickRunTime()),
        RUN_TIME_TICK_INTERVAL_MS
      )
    }
  }

  function clearRunTimerInterval () {
    clearInterval(runTimerInterval)
    runTimerInterval = NO_INTERVAL
  }

  function handleApiSession (apiSession) {
    const {
      name,
      protocol_text,
      commands,
      command_log,
      state,
      instruments,
      containers
    } = apiSession
    const protocolCommands = []
    const protocolCommandsById = {}
    const protocolInstrumentsByAxis = {}
    const protocolLabwareBySlot = {}

    // ensure run timer is running or stopped
    if (state === constants.RUNNING) {
      setRunTimerInterval()
    } else {
      clearRunTimerInterval()
    }

    // TODO(mc, 2017-08-30): Use a reduce
    commands.forEach(makeHandleCommand())
    instruments.forEach(apiInstrumentToInstrument)
    containers.forEach(apiContainerToContainer)

    const payload = {
      sessionName: name,
      protocolText: protocol_text,
      protocolCommands,
      protocolCommandsById,
      protocolInstrumentsByAxis,
      protocolLabwareBySlot,
      // TODO(mc, 2017-09-06): handle session errors
      sessionErrors: [],
      sessionState: state
    }

    dispatch(actions.sessionResponse(null, payload))

    function makeHandleCommand (depth = 0) {
      return function handleCommand (command) {
        const {id, description} = command
        const logEntry = command_log[id]
        const children = Array.from(command.children)
        let handledAt = ''

        if (logEntry) handledAt = logEntry.timestamp
        if (depth === 0) protocolCommands.push(id)

        children.forEach(makeHandleCommand(depth + 1))

        protocolCommandsById[id] = {
          id,
          description,
          handledAt,
          children: children.map((c) => c.id)
        }
      }
    }

    function apiInstrumentToInstrument (apiInstrument) {
      const {_id, axis: originalAxis, name, channels} = apiInstrument
      const axis = INSTRUMENT_AXES[originalAxis]
      const volume = Number(name.match(RE_VOLUME)[1])

      protocolInstrumentsByAxis[axis] = {_id, axis, name, channels, volume}
    }

    function apiContainerToContainer (apiContainer) {
      const {_id, name, type, slot: id} = apiContainer
      const isTiprack = RE_TIPRACK.test(type)
      const slot = letterSlotToNumberSlot(id)

      protocolLabwareBySlot[slot] = {_id, name, id, slot, type, isTiprack}
    }
  }

  function handleRobotNotification (message) {
    const {name, payload} = message

    switch (name) {
      case 'state':
        handleApiSession(payload)
        break
    }
  }

  function handleClientError (error) {
    console.error(error)
  }
}

// TODO(mc, 2017-10-03): be less "clever" about this
// map A1 -> 1, B1 -> 2, C1 -> 3, A2 -> 4, ..., B4 -> 11
function letterSlotToNumberSlot (slot) {
  // split two-char string into charcodes
  const [col, row] = Array.from(slot.toUpperCase()).map((c) => c.charCodeAt(0))

  // slot = (col where A === 1, B === 2, C === 3) + 3 * (row - 1)
  // 'A'.charCodeAt(0) === 65, '1'.charCodeAt(0) === 49
  // before simplification: 3 * (row - 49) + (col - 64)
  return (3 * row + col - 211)
}
