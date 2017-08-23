// redux middleware for communicating with the robot
// TODO(mc): as written, this is pretty hard to test. Spend some time thinking
// about how to refactor so that this is not the case

import assert from 'assert'
import log from 'winston'
import Client from '../../rpc/client'
import {NAME, actions, actionTypes, selectors} from './'

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

  const handleContainerAndGetRobot = (rpcRobotContainer) => {
    robotContainer = rpcRobotContainer

    return robotContainer.new_robot()
  }

  const handleRobot = (rpcRobot) => {
    robot = rpcRobot

    return robot.get_serial_ports_list()
  }

  // TODO(mc): serial port connection should not be the responsibility
  // of the client. Remove BEFORE RELEASE when backend handles it
  const handleConnect = (ports) => {
    assert(ports.length, `No serial ports found; cannot connect to Smoothie`)
    serialPort = ports[0]
    dispatch(actions.connectResponse())
  }

  const handleConnectError = (e) => dispatch(actions.connectResponse(e))

  return (next) => (action) => {
    const {type, meta, payload} = action

    if (!meta || !meta.robotCommand) return next(action)

    switch (type) {
      case actionTypes.CONNECT:
        connect(payload)
        break

      case actionTypes.LOAD_PROTOCOL:
        loadProtocol()
        break

      case actionTypes.HOME:
        home(payload)
        break

      case actionTypes.RUN:
        run(payload)
        break
    }

    next(action)
  }

  function connect () {
    // initialize websocket connection
    // TODO(mc): Hardcoded URL is bad and also: retries?
    return Client(URL)
      .then(subscibeAndGetRobotContainer)
      .then(handleContainerAndGetRobot)
      .then(handleRobot)
      .then(handleConnect)
      // TODO(mc): maybe remove this debug stuff?
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          global.client = client
          global.robotContainer = robotContainer
          global.robot = robot
        }
      })
      .catch(handleConnectError)
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

  // load protocol
  function loadProtocol () {
    const robotState = getState()[NAME]
    const file = selectors.getProtocolFile(robotState)

    robotContainer.load_protocol_file(file)
      .then((virtualRobot) => virtualRobot.commands())
      .then((commands) => dispatch(actions.setCommands(commands)))
      // TODO(mc, 2017-08-23): filter error types, possibly using Bluebird
      .catch((error) => dispatch(actions.setProtocolError(error)))
  }

  function run () {
    robotContainer
      .run(serialPort)
      .then(() => dispatch(actions.runResponse()))
      .catch((error) => dispatch(actions.runResponse(error)))
  }

  function handleRobotNotification (message) {
    // TODO(mc, 2017-08-23): change this log to debug
    log.info('Recieved robot notification: %j', message)
  }

  function handleClientError (error) {
    console.error(error)
  }
}
