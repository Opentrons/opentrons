// robot api client
// takes a dispatch (send) function and returns a receive handler
import RpcClient from '../../../rpc/client'
import {actions, actionTypes} from '../actions'

// TODO(mc, 2017-08-29): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'

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

      case actionTypes.SESSION:
        createSession(state, action)
        break

      case actionTypes.RUN:
        run(state, action)
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

  function createSession (state, action) {
    const file = action.payload.file
    const name = file.name
    const reader = new FileReader()

    reader.onload = function handleProtocolRead (event) {
      sessionManager.create(name, event.target.result)
        .then(handleApiSession)
        .catch((error) => dispatch(actions.sessionResponse(error)))
    }

    return reader.readAsText(file)
  }

  function handleApiSession (apiSession) {
    session = apiSession

    const {name, protocol_text, commands, command_log, state} = session
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

  function run (state, action) {
    session
      .run(serialPort)
      .then(() => dispatch(actions.runResponse()))
      .catch((error) => dispatch(actions.runResponse(error)))
  }

  function handleRobotNotification (message) {
    const [command, payload] = message

    if (command.name === 'session.state.change') {
      console.log(message)
    }

    switch (command.name) {
      case 'add-command':
        handleApiSession(payload)
        break
    }
  }

  function handleClientError (error) {
    console.error(error)
  }
}
