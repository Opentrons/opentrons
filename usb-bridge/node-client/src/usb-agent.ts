import * as http from 'http'
import agent from 'agent-base'
import type { Duplex } from 'stream'

import { SerialPort } from 'serialport'

export interface AgentOptions {
  serialPort: string
}

export function buildUSBAgent(opts: AgentOptions): http.Agent {
  console.log(`path is ${opts.serialPort}`)
  const port = new SerialPort({ path: opts.serialPort, baudRate: 115200 })
  const usbAgent = agent(
    (req: http.ClientRequest, opts: http.RequestOptions): Duplex => port
  )
  usbAgent.maxFreeSockets = 1
  usbAgent.maxSockets = 1
  usbAgent.maxTotalSockets = 1
  usbAgent.destroy = () => port.close()
  return usbAgent
}
