import path from 'path'
import log from 'winston'

import Client from '../../rpc/client'

log.level = 'warning'

const URL = 'ws://127.0.0.1:31950/'
const PROTOCOL = path.join(__dirname, '../../../api/opentrons/server/tests/data/dinosaur.py')

describe('RPC integration test', () => {
  let client

  beforeEach(async () => (client = await Client(URL)))
  afterEach(() => client.close())

  it('should be able to connect to server and load a protocol', async () => {
    client = await Client(URL)

    const robotContainer = await client.control.get_root()
    const robot = await robotContainer.load_protocol_file(PROTOCOL)

    console.log(await robot.commands())
  })
})
