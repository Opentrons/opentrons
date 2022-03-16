import 'jest'
import * as fs from 'fs'
import { getHealth, Health } from '../health'
import { HostConfig } from '../types'
import { Response } from '../request'
import { createProtocol, Protocol } from '../protocols'

const host: HostConfig = {
  hostname: process.env.DEV_ROBOT_HOST != null ? process.env.DEV_ROBOT_HOST : '',
  port: process.env.DEV_ROBOT_PORT != null ? +process.env.DEV_ROBOT_PORT : 0,
}
console.log(`host config is: ${host.hostname}:${host.port?.toString()}`)

describe('health tests', () => {
  it.only('getHealth matches the snapshot', async () => {
    const healthResponse: Response<Health> = await getHealth(host)
    expect(healthResponse.data).toMatchSnapshot()
  })
})

describe('modules', () => {
  it.only('getModules matches the snapshot', async () => {
    // cannot getModules with api-client
  })
})


/* describe('protocols', () => {
  it('upload a python protocol', async () => {
    const file = fs.readFileSync(
      '../../robot-server/tests/integration/protocols/basic_transfer_standalone.py',
      'utf8'
    )
    const files: File[] = [new File([file], 'basic_transfer_standalone.py')]
    const protocolCreateResponse: Response<Protocol> = await createProtocol(
      host,
      files
    )
    console.log(protocolCreateResponse)
  })
}) */
