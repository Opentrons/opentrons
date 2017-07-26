import log from 'winston'
import path from 'path'
log.level = 'warning'

const { Connection, Client } = require('../../rpc/client')

describe('Remote protocol run', () => {
  it('Runs', async () => {
    const { promise, socket } = Connection(
      'ws://127.0.0.1:31950/'
    )
    const connection = await promise
    const client = await Client(connection)
    const robotContainer = await client.get_root()
    const robot = await robotContainer.load_protocol_file(
      path.join(__dirname, '../../../api/opentrons/server/tests/data/dinosaur.py'))
    console.log(await robot.commands())
    console.log(await robot._deck)
    socket.close()
  })
})
