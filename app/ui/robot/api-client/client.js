// robot api client
// takes a dispatch (send) function and returns a receive handler
import RpcClient from '../../../rpc/client'
import {actions, actionTypes} from '../actions'

// TODO(mc, 2017-08-29): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'

export default function client (dispatch) {
  let rpcClient
  let robotContainer
  let robot
  // TODO(mc, 2017-08-29): remove when server handles serial port
  let serialPort

  return function receive (state, action) {
    const {type} = action

    switch (type) {
      case actionTypes.CONNECT:
        connect(state, action)
        break

      case actionTypes.NEW_SESSION:
        newSession(state, action)
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

        return rpcClient.control.get_root()
      })
      .then((rc) => {
        robotContainer = rc
        return robotContainer.new_robot()
      })
      .then((r) => {
        robot = r
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

  function session (state, action) {
    const file = action.payload && action.payload.file

    if (file) {
      const name = file.name
      const reader = new FileReader()

      reader.onload = function handleProtocolRead (event) {
        console.log('NEW SESSION')
        console.log(event.target.result)
      }

      return reader.readFileAsText(file)
    }

    console.log('GET SESSION')
  }

  function handleRobotNotification (message) {
    switch (message.name) {
      case 'add-command':
        dispatch(actions.tickCurrentCommand())
        break
    }
  }

  function handleClientError (error) {
    console.error(error)
  }
}
