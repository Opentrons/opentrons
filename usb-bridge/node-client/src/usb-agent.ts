import * as http from 'http'
import agent from 'agent-base'
import type { Duplex } from 'stream'

import { SerialPort } from 'serialport'

import type { AgentOptions } from 'http'
import type { Socket } from 'net'
import type { PortInfo } from '@serialport/bindings-cpp'
import type { Logger, LogLevel } from './types'

export type { PortInfo }

export interface SerialPortListMonitorConfig {
  /** Call the health endpoints for a given IP once every `interval` ms */
  interval?: number
}

/**
 * A serial port list monitor that can be started and stopped as needed
 */
export interface SerialPortListMonitor {
  /** Start monitoring available serial ports  */
  start: (config: SerialPortListMonitorConfig) => void
  /** Stop monitoring available serial ports */
  stop: () => void
}

interface SerialPortListMonitorOptions {
  /** Function to call whenever the requests for serial ports settle */
  onSerialPortFetch?: (list: PortInfo[]) => void
  /** Optional logger */
  logger?: Logger
}

export function buildUSBAgent(opts: { serialPort: string }): http.Agent {
  console.log(`path is ${opts.serialPort}`)
  const port = new SerialPort({ path: opts.serialPort, baudRate: 115200 })
  const usbAgent = agent(
    (req: http.ClientRequest, opts: http.RequestOptions): Duplex => {
      if (!port.isOpen && !port.opening) port.open()
      return port
    }
  )

  usbAgent.maxFreeSockets = 1
  usbAgent.maxSockets = 1
  usbAgent.maxTotalSockets = 1
  usbAgent.destroy = () => port.close()
  return usbAgent
}

export function fetchSerialPortList(): Promise<PortInfo[]> {
  return SerialPort.list()
}

export function createSerialPortListMonitor(
  options: SerialPortListMonitorOptions
): SerialPortListMonitor {
  const { onSerialPortFetch, logger } = options
  const log = (
    level: LogLevel,
    msg: string,
    meta: Record<string, unknown> = {}
  ): void => {
    typeof logger?.[level] === 'function' && logger[level](msg, meta)
  }

  let interval = 0
  let serialPortPollIntervalId: NodeJS.Timeout | null = null

  function start(config: SerialPortListMonitorConfig): void {
    const { interval: nextInterval } = config ?? {}
    let needsNewSerialPortInterval = serialPortPollIntervalId === null

    if (nextInterval != null && nextInterval !== interval) {
      interval = nextInterval
      needsNewSerialPortInterval = true
    }

    if (needsNewSerialPortInterval && interval > 0) {
      const handlePoll = (): void => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchSerialPortList().then((list: PortInfo[]) => {
          onSerialPortFetch?.(list)
        })
      }

      stop()
      log('debug', 'starting new serial port poll interval')
      serialPortPollIntervalId = setInterval(handlePoll, interval)
    } else {
      log(
        'debug',
        'serial port poller (re)start called but no new interval needed'
      )
    }
  }

  function stop(): void {
    log('debug', 'stopping serial port poller')
    if (serialPortPollIntervalId != null) {
      clearInterval(serialPortPollIntervalId)
    }
    serialPortPollIntervalId = null
  }

  return { start, stop }
}

const SOCKET_OPEN_RETRY_TIME = 10000
class SerialPortSocket extends SerialPort {
  // allow node socket destroy
  destroy(): void {}

  // added these to squash keepAlive errors
  setKeepAlive(): void {}
  unref(): void {}
  setTimeout(): void {}
  ref(): void {}
}

interface SerialPortHttpAgentOptions extends AgentOptions {
  path: string
  logger: Logger
}

const kOnKeylog = Symbol.for('onkeylog')

class SerialPortHttpAgent extends http.Agent {
  declare totalSocketCount: number
  declare sockets: NodeJS.Dict<Socket[]>
  declare emit: (
    event: string,
    socket: SerialPortSocket,
    options: NodeJS.Dict<unknown>
  ) => void

  declare getName: (options: NodeJS.Dict<unknown>) => string
  declare removeSocket: (
    socket: SerialPortSocket,
    options: NodeJS.Dict<unknown>
  ) => void;

  // node can assign a keylogger to the agent for debugging, this allows adding the keylog listener to the event
  declare [kOnKeylog]: (...args: unknown[]) => void

  constructor(options: SerialPortHttpAgentOptions) {
    super(options)
    this.options = options
  }

  // TODO: add method to close port (or destroy agent)

  options: {
    path: string
    logger?: Logger
  } = { path: '' }

  log = (
    level: LogLevel,
    msg: string,
    meta: Record<string, unknown> = {}
  ): void => {
    typeof this.options.logger?.[level] === 'function' &&
      this.options.logger[level](msg, meta)
  }

  // copied from _http_agent.js, replacing this.createConnection
  createSocket(
    req: http.ClientRequest,
    options: NodeJS.Dict<unknown>,
    cb: Function
  ): void {
    this.log('info', `creating usb socket at ${this.options.path}`)
    options = { __proto__: null, ...options, ...this.options }
    const name = this.getName(options)
    options._agentKey = name
    options.encoding = null
    const oncreate = once((err, s) => {
      if (err != null) return cb(err)
      if (this.sockets[name] == null) {
        this.sockets[name] = []
      }
      this.sockets[name]?.push(s as Socket)
      this.totalSocketCount++
      this.log(
        'debug',
        `sockets ${name} ${this.sockets[name]?.length ?? ''} ${
          this.totalSocketCount
        }`
      )
      installListeners(this, s as SerialPortSocket, options)
      cb(null, s)
    })

    const socket = new SerialPortSocket({
      path: this.options.path,
      baudRate: 1152000,
    })
    if (!socket.isOpen && !socket.opening) {
      socket.open(error => {
        this.log(
          'error',
          `could not open serialport socket: ${error?.message}. Retrying in ${SOCKET_OPEN_RETRY_TIME} ms`
        )
        setTimeout(() => {
          socket.open()
        }, SOCKET_OPEN_RETRY_TIME)
      })
    }
    if (socket != null) oncreate(null, socket)
  }
}

// js function from internal/util.js
function once<T extends (this: unknown, ...args: unknown[]) => T, U>(
  callback: T
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): (this: unknown, ...args: U[]) => T | void {
  let called = false
  return function (...args) {
    if (called) return
    called = true
    return Reflect.apply(callback, this, args)
  }
}

// most copied from _http_agent.js; onData and onFinish listeners added to log and close serial port
function installListeners(
  agent: SerialPortHttpAgent,
  s: SerialPortSocket,
  options: { [k: string]: unknown }
): void {
  function onFree(): void {
    agent.log('debug', 'CLIENT socket onFree')
    // need to emit free to attach listeners to serialport
    agent.emit('free', s, options)
  }
  s.on('free', onFree)

  function onError(err: Error): void {
    agent.log('error', `CLIENT socket onError: ${err?.message}`)
  }
  s.on('error', onError)

  function onClose(): void {
    agent.log('debug', 'CLIENT socket onClose')
    // This is the only place where sockets get removed from the Agent.
    // If you want to remove a socket from the pool, just close it.
    // All socket errors end in a close event anyway.
    agent.totalSocketCount--
    agent.removeSocket(s, options)
  }
  s.on('close', onClose)

  function onTimeout(): void {
    agent.log(
      'debug',
      'CLIENT socket onTimeout, closing and reopening the socket'
    )

    s.close()
    setTimeout(() => {
      s.open()
    }, 3000)
  }
  s.on('timeout', onTimeout)

  function onFinish(): void {
    agent.log('info', 'socket finishing: closing serialport')
    s.close()
  }
  s.on('finish', onFinish)

  if (agent[kOnKeylog] != null) {
    s.on('keylog', agent[kOnKeylog])
  }

  function onRemove(): void {
    // We need this function for cases like HTTP 'upgrade'
    // (defined by WebSockets) where we need to remove a socket from the
    // pool because it'll be locked up indefinitely
    agent.log('debug', 'CLIENT socket onRemove')
    agent.totalSocketCount--
    agent.removeSocket(s, options)
    s.removeListener('close', onClose)
    s.removeListener('free', onFree)
    s.removeListener('timeout', onTimeout)
    s.removeListener('finish', onFinish)
    s.removeListener('agentRemove', onRemove)
    if (agent[kOnKeylog] != null) {
      s.removeListener('keylog', agent[kOnKeylog])
    }
  }
  s.on('agentRemove', onRemove)
}

export { SerialPortHttpAgent }
