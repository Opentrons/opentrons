import { Connection, Client } from './client'

//
// Questions:
// 1. How to un-box payload when we need a value of a target
// 2. Do we want calls to return promise?
// 3. What to do if function and class attribute have the same name?
//

const main = async () => {
  const { promise } = Connection(
    'ws://127.0.0.1:31950/'
  )
  const connection = await promise
  const client = await Client(connection)
  const robotContainer = await client.get_root()
  const robot = await robotContainer.load_protocol_file(
    '/Users/astaff/Development/opentrons/opentrons-api/api/opentrons/server/tests/data/dinosaur.py')
  console.log(await robot.commmands())
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
