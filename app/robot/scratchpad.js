import connect from './proxy'

const main = async () => {
  const proxy = await connect(
    'ws://127.0.0.1:31950/',
    (message) => console.log(message))

  console.log(proxy)
  let foo = await proxy.get_foo()
  console.log(proxy.value)
  console.log(await foo.get_value())
  foo = await foo.get_next()
  console.log(await foo.get_value())
  proxy.disconnect()
}

main()
  .then(() => {
    console.log('Success')
    process.exit()
    return 0
  })
  .catch((message) => {
    console.log('Error: ', message)
    process.exit()
  })

// let robot = remote.load_protocol('from opentrons import robot')
// robot = remote.set_environment(robot, remote.virtual_smoothie())
// robot.run()

// console.log(robot.commands())

// robot = remote.set_environment(robot, remote.serial_connection())
// robot.run()

// console.log(remote.get_robot())
