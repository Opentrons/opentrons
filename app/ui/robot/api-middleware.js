// redux middleware for communicating with the robot
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
    dispatch(actions.connectResponse())
  }

  const handleConnectError = (error) => {
    dispatch(actions.connectResponse(error))
  }

  console.log('connecting')

  // initialize websocket connection
  // TODO(mc): maybe don't connect automatically? Retries?
  Client(URL)
    .then(subscibeAndGetRobotContainer)
    .then(handleContainerAndGetRobot)
    .then(handleRobot)
    .catch(handleConnectError)
    .then(() => console.log('connect done'))

  return (next) => (action) => handleCommand(robot, dispatch, next, action)
}

function handleCommand (robot, dispatch, next, action) {
  const {type, payload, meta} = action

  if (!meta || !meta.robotCommand) return next(action)

  switch (type) {
    case actionTypes.HOME:
      home(robot, dispatch, payload.axes)
  }

  next(action)
}

function home (robot, dispatch, axes) {
  const runCommand = axes
    ? robot.home(axes)
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
