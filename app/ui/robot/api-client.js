// redux middleware for communicating with the robot
// TODO(mc): as written, this is pretty hard to test. Spend some time thinking
// about how to refactor so that this is not the case

import Client from '../../rpc/client'
import {actions, actionTypes} from './'

// TODO(mc): don't hardcode this URL
const URL = 'ws://127.0.0.1:31950'

export default function apiMiddleware (store) {
  const {dispatch} = store
  let client
  let robotContainer
  let robot

  const subscibeAndGetRobotContainer = (rpcClient) => {
    client = rpcClient
      .on('notification', handleRobotNotification)
      .on('error', handleClientError)

    return client.control.get_root()
  }

  const handleContainerAndGetRobot = (rpcRobotContainer) => {
    robotContainer = rpcRobotContainer

    return robotContainer.get_robot()
  }

  const handleRobot = (rpcRobot) => {
    robot = rpcRobot
    // TODO(mc): with proper selectors, multiple dispatches like this are ok
    // so... make sure there are proper selectors in place so we don't trigger
    // unecessary re-renders
    dispatch(actions.connectResponse())
    dispatch(actions.setIsConnected(true))
  }

  const handleConnectError = (error) => {
    dispatch(actions.connectResponse(error))
  }

  return (next) => (action) => {
    const {type, payload, meta} = action

    if (!meta || !meta.robotCommand) return next(action)

    switch (type) {
      case actionTypes.CONNECT:
        connect()
        break

      case actionTypes.HOME:
        home(robot, dispatch, payload)
        break
    }

    next(action)
  }

  function connect () {
    // initialize websocket connection
    // TODO(mc): Hardcoded URL is bad and also: retries?
    Client(URL)
      .then(subscibeAndGetRobotContainer)
      .then(handleContainerAndGetRobot)
      .then(handleRobot)
      .then(() => {
        // TODO(mc): maybe remove this debug stuff?
        if (process.env.NODE_ENV === 'development') {
          global.client = client
          global.robotContainer = robotContainer
          global.robot = robot
        }
      })
      .catch(handleConnectError)
  }

  function home (payload) {
    const runCommand = payload && payload.axes
      ? robot.home(payload.axes)
      : robot.home()

    runCommand
      .then(() => actions.homeResponse())
      .catch((error) => actions.homeResponse(error))
  }

  function handleRobotNotification (message) {
    console.log('Recieved robot notification: %j', message)
  }

  function handleClientError (error) {
    console.error(error)
  }
}
