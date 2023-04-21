import * as http from 'http'
import agent from 'agent-base'
import type { Duplex } from 'stream'

import { SerialPort } from 'serialport'

import type { AgentOptions } from 'http'
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
      if (!port.isOpen) port.open()
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

class SerialPortSocket extends SerialPort {
  // log write method
  write(args: any): any {
    console.log(`serialport writing ${args}`)
    return super.write(args)
  }

  // added these to squash keepAlive errors
  setKeepAlive(): void {}
  unref(): void {}
  setTimeout(): void {}
  ref(): void {}
}

interface SerialPortHttpAgentOptions extends AgentOptions {
  path: string
}

class SerialPortHttpAgent extends http.Agent {
  constructor(options: SerialPortHttpAgentOptions) {
    super(options)
    this.options = options
  }

  options: { path: string } = { path: '' }
  // totalSocketCount!: number

  // copied from _http_agent.js, replacing this.createConnection
  createSocket(
    req: http.ClientRequest,
    options: { [k: string]: unknown },
    cb: Function
  ): void {
    console.log('called createSocket with options', options)
    options = { __proto__: null, ...options, ...this.options }
    if (options.socketPath) options.path = options.socketPath
    if (!options.servername && options.servername !== '')
      options.servername = calculateServerName(options, req)
    const name = this.getName(options)
    options._agentKey = name
    // debug("createConnection", name, options);
    options.encoding = null
    const oncreate = once((err, s) => {
      if (err) return cb(err)
      if (!this.sockets[name]) {
        this.sockets[name] = []
      }
      Array.prototype.push(this.sockets[name], s)
      this.totalSocketCount++
      // debug("sockets", name, this.sockets[name].length, this.totalSocketCount);
      installListeners(this, s, options)
      cb(null, s)
    })
    // TODO(BTH: what does this do without createConnection?)
    // When keepAlive is true, pass the related options to createConnection
    // if (this.keepAlive) {
    //   options.keepAlive = this.keepAlive;
    //   options.keepAliveInitialDelay = this.keepAliveMsecs;
    // }
    const socket = new SerialPortSocket({
      path: this.options.path,
      baudRate: 115200,
    })
    if (!socket.isOpen && !socket.opening) {
      socket.open()
    }
    if (socket) oncreate(null, socket)
  }
}

// copied from internal/util.js
function once<T extends (this: unknown, ...args: unknown[]) => T>(
  callback: T
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): (this: unknown, args: any) => T | void {
  let called = false
  return function (...args) {
    if (called) return
    called = true
    return Reflect.apply<ThisParameterType<unknown>, unknown[], T>(
      callback,
      this,
      args
    )
  }
}

// most copied from _http_agent.js; onData and onFinish listeners added to log and close serial port
function installListeners(
  agent: SerialPortHttpAgent,
  s: SerialPortSocket,
  options: { [k: string]: unknown }
): void {
  function onFree(): void {
    // debug('CLIENT socket onFree');
    // need to emit free to attach listeners to serialport
    agent.emit('free', s, options)
  }
  s.on('free', onFree)

  function onClose(err): void {
    // debug('CLIENT socket onClose');
    // This is the only place where sockets get removed from the Agent.
    // If you want to remove a socket from the pool, just close it.
    // All socket errors end in a close event anyway.
    agent.totalSocketCount--
    agent.removeSocket(s, options)
  }
  s.on('close', onClose)

  function onTimeout(): void {
    // debug('CLIENT socket onTimeout');

    // Destroy if in free list.
    // TODO(ronag): Always destroy, even if not in free list.
    const sockets = agent.freeSockets
    if (
      Array.prototype.some(Object.keys(sockets), name =>
        Array.prototype.includes(sockets[name], s)
      )
    ) {
      return s.destroy()
    }
  }
  s.on('timeout', onTimeout)

  function onData(chunk: unknown): void {
    console.log(`received chunk:  ${chunk}`)
    console.log('end chunk')
  }
  s.on('data', onData)

  function onFinish(): void {
    console.log('socket finishing: closing serialport')
    s.close()
  }
  s.on('finish', onFinish)

  function onRemove(): void {
    // We need this function for cases like HTTP 'upgrade'
    // (defined by WebSockets) where we need to remove a socket from the
    // pool because it'll be locked up indefinitely
    // debug('CLIENT socket onRemove');
    agent.totalSocketCount--
    agent.removeSocket(s, options)
    s.removeListener('close', onClose)
    s.removeListener('free', onFree)
    s.removeListener('timeout', onTimeout)
    s.removeListener('data', onData)
    s.removeListener('finish', onFinish)
    s.removeListener('agentRemove', onRemove)
  }
  s.on('agentRemove', onRemove)

  if (agent[kOnKeylog]) {
    s.on('keylog', agent[kOnKeylog])
  }
}

const kOnKeylog = Symbol('onkeylog')

export { SerialPortHttpAgent }
