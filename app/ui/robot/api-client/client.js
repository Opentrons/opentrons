// robot api client
// takes a dispatch (send) function and returns a receive handler
import RpcClient from '../../../rpc/client'
import {actions, actionTypes} from '../actions'

// TODO(mc, 2017-08-29): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'
const RUN_TIME_TICK_INTERVAL_MS = 200

export default function client (dispatch) {
  let rpcClient
  let sessionManager
  let session
  let robot
  // TODO(mc, 2017-08-29): remove when server handles serial port
  let serialPort

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
    RpcClient(URL)
      .then((c) => {
        rpcClient = c
        rpcClient
          .on('notification', handleRobotNotification)
          .on('error', handleClientError)

        sessionManager = rpcClient.remote
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
    const interval = setInterval(
      () => dispatch(actions.tickRunTime()),
      RUN_TIME_TICK_INTERVAL_MS
    )

    // TODO(mc, 2017-09-07): consider using Bluebird disposers for the interval
    session.run(serialPort)
      .then(() => dispatch(actions.runResponse()))
      .catch((error) => dispatch(actions.runResponse(error)))
      .then(() => clearInterval(interval))
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

  function handleApiSession (apiSession) {
    const {name, protocol_text, commands, command_log, state} = apiSession
    const protocolCommands = []
    const protocolCommandsById = {}

    // TODO(mc, 2017-08-30): Use a reduce
    commands.forEach(makeHandleCommand())

    dispatch(actions.sessionResponse(null, {
      sessionName: name,
      protocolText: protocol_text,
      protocolCommands,
      protocolCommandsById,
      // TODO(mc, 2017-09-06): handle session errors
      sessionErrors: [],
      sessionState: state
    }))

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
