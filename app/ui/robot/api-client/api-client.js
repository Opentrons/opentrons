// redux middleware for communicating with the robot
// TODO(mc): as written, this is pretty hard to test. Spend some time thinking
// about how to refactor so that this is not the case

import log from 'winston'
import Client from '../../rpc/client'
import {actions, actionTypes, selectors} from './'

// TODO(mc): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'

export default function apiMiddleware (store) {
  const {getState, dispatch} = store
  let client
  let robotContainer
  let robot
  // TODO(mc, 2017-08-23): remove (if server handles port) or put it in redux
  let serialPort

  const subscibeAndGetRobotContainer = (rpcClient) => {
    client = rpcClient
      .on('notification', handleRobotNotification)
      .on('error', handleClientError)

    return client.control.get_root()
  }

  return (next) => (action) => {
    const {type, meta, payload} = action

    if (!meta || !meta.robotCommand) return next(action)

    switch (type) {
      case actionTypes.CONNECT:
        connect(payload)
        break

      case actionTypes.LOAD_PROTOCOL:
        loadProtocol(payload)
        break

      case actionTypes.HOME:
        home(payload)
        break

      case actionTypes.RUN:
        run(payload)
        break

      case actionTypes.PAUSE:
        pause(payload)
        break

      case actionTypes.RESUME:
        resume(payload)
        break

      case actionTypes.CANCEL:
        cancel(payload)
        break
    }

    next(action)
  }

  function home (payload) {
    robot.connect(serialPort)
      .then(() => {
        if (payload && payload.axes) {
          return robot.home(payload.axes)
        }

        return robot.home()
      })
      .then(() => robot.disconnect())
      .then(() => dispatch(actions.homeResponse()))
      .catch((error) => dispatch(actions.homeResponse(error)))
  }

  function run () {
    robotContainer
      .run(serialPort)
      .then(() => dispatch(actions.runResponse()))
      .catch((error) => dispatch(actions.runResponse(error)))
  }

  function pause () {
    robot
      .pause()
      .then(() => dispatch(actions.pauseResponse()))
      .catch((error) => dispatch(actions.pauseResponse(error)))
  }

  function resume () {
    robot
      .resume()
      .then(() => dispatch(actions.resumeResponse()))
      .catch((error) => dispatch(actions.resumeResponse(error)))
  }

  function cancel () {
    robot
      .stop()
      .then(() => dispatch(actions.cancelResponse()))
      .catch((error) => dispatch(actions.cancelResponse(error)))
  }

  function handleRobotNotification (message) {
    // TODO(mc, 2017-08-23): change this log to debug
    log.info('Recieved robot notification: %j', message)

    if (!selectors.getIsReadyToRun(getState())) return

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
