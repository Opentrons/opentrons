import connect from './proxy'

connect(
  'ws://127.0.0.1:31950/',
  (message) => console.log(message))
  .then((remote) => remote.disconnect())
  .catch((error) => {
    console.error(error)
    process.exit()
  })

// let robot = remote.load_protocol('from opentrons import robot')
// robot = remote.set_environment(robot, remote.virtual_smoothie())
// robot.run()

// console.log(robot.commands())

// robot = remote.set_environment(robot, remote.serial_connection())
// robot.run()

// console.log(remote.get_robot())
