import * as http from 'http'
import agent from 'agent-base'
import { Duplex } from 'stream'
import type { Timeout } from 'timers'

import { SerialPort } from 'serialport'

import type { AgentOptions } from 'http'
import type { Socket } from 'net'
import type { PortInfo } from '@serialport/bindings-cpp'
import type { Logger, LogLevel } from './types'

const MAX_SOCKET_CREATE_RETRIES = 10
const SOCKET_OPEN_RETRY_TIME_MS = 100

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

interface SerialPortHttpAgentOptions extends AgentOptions {
  path: string
  logger: Logger
}

function socketEmulatorFromPort(port: SerialPort): Socket {
  // build a duplex stream to act as a socket that we can give to node https internals, linked
  // to an open usb serial port.
  //
  // this is a separate stream rather than just passing in the port so that we can sever the
  // lifetimes and lifecycles of the socket and the port. sockets want to be closed and opened all
  // the time by node http internals, and we don't want that for the port since opening and closing it
  // can take a while. this lets us open and close and create and destroy sockets at will while not
  // affecting the port.

  // unfortunately, because we need to sever the lifecycles, we can't use node stream pipelining
  // since half the point of node stream pipelining is to link stream lifecycles. instead, we do a
  // custom duplex implementation whose lower interface talks to the upper interface of the port...
  // which is something that's really annoying without using pipelining, which we can't use. so
  // this closed-over mutable doRead has to stand in for the pause event propagating down; we have to
  // add or remove data listeners to the port stream to propagate read backpressure.
  let doRead = false
  const socket = new Duplex({
    write(chunk, encoding, cb) {
      return port.write(chunk, encoding, cb)
    },
    read() {
      if (!doRead) {
        port.on('data', dataForwarder)
        doRead = true
      }
    },
  }) as Socket

  const dataForwarder = (chunk: any): void => {
    if (doRead) {
      doRead = socket.push(chunk)
      if (!doRead) {
        port.removeListener('data', dataForwarder)
      }
    }
  }

  // since this socket is independent from the port, we can do stuff like "have an activity timeout"
  // without worrying that it will kill the socket
  let currentTimeout: Timeout | null = null
  const refreshTimeout = (): void => currentTimeout && currentTimeout.refresh()
  socket.on('data', refreshTimeout)
  socket.setTimeout = (timeout, callable?) => {
    clearTimeout(currentTimeout)
    if (timeout === 0 && currentTimeout) {
      currentTimeout = null
    } else if (timeout !== 0) {
      currentTimeout = setTimeout(() => {
        console.log('socket timed out')
        socket.emit('timeout')
      }, timeout)
      if (callable) {
        socket.once('timeout', callable)
      }
    }

    return socket
  }
  // important: without this we'll leak sockets since the port event emitter will hold a ref to dataForwarder which
  // closes over the socket
  socket.on('close', () => {
    port.removeListener('data', dataForwarder)
  })

  // some little functions to have the right shape for the http internals
  socket.ref = () => socket
  socket.unref = () => socket
  socket.setKeepAlive = () => {
    return socket
  }
  socket.setNoDelay = () => {
    return socket
  }

  socket.on('finish', () => {
    socket.emit('close')
  })
  socket.on('close', () => {
    currentTimeout && clearTimeout(currentTimeout)
  })
  return socket
}

const kOnKeylog = Symbol.for('onkeylog')

class SerialPortHttpAgent extends http.Agent {
  declare totalSocketCount: number
  declare sockets: NodeJS.Dict<Socket[]>
  declare emit: (
    event: string,
    socket: Socket,
    options: NodeJS.Dict<unknown>
  ) => void

  declare getName: (options: NodeJS.Dict<unknown>) => string
  declare removeSocket: (socket: Socket, options: NodeJS.Dict<unknown>) => void;

  // node can assign a keylogger to the agent for debugging, this allows adding the keylog listener to the event
  declare [kOnKeylog]: (...args: unknown[]) => void

  constructor(
    options: SerialPortHttpAgentOptions,
    onComplete: (err: Error | null, agent?: SerialPortHttpAgent) => void
  ) {
    super(options)
    this.options = options
    const openRetryer: (err: Error | null) => void = err => {
      if (err != null) {
        if (this.remainingRetries > 0 && !this.destroyed) {
          const message = err?.message ?? err
          this.log(
            'info',
            `Failed to open port: ${message} , retrying ${this.remainingRetries} more times`
          )
          this.remainingRetries--
          setTimeout(
            () => this.port.open(openRetryer),
            SOCKET_OPEN_RETRY_TIME_MS
          )
        } else if (!this.destroyed) {
          const message = err?.message ?? err
          this.log(
            'info',
            `Failed to open port after ${this.remainingRetries} attempts: ${message}`
          )
          this.destroy()
          onComplete(err)
        } else {
          this.log(
            'info',
            `Cancelling open attempts because the agent was destroyed`
          )
          onComplete(new Error('Agent destroyed while opening'))
        }
      } else if (!this.destroyed) {
        this.log('info', `Port ${this.options.path} now open`)
        onComplete(null, this)
      } else {
        this.log('info', `Port was opened but agent is now destroyed, closing`)
        if (this.port.isOpen) {
          this.port.close()
        }
        onComplete(new Error('Agent destroyed while opening'))
      }
    }
    this.log(
      'info',
      `creating and opening serial port for ${this.options.path}`
    )
    this.port = new SerialPort(
      { path: this.options.path, baudRate: 1152000, autoOpen: true },
      openRetryer
    )
  }

  port: SerialPort
  remainingRetries: number = MAX_SOCKET_CREATE_RETRIES
  destroyed: boolean = false

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

  destroy(): void {
    this.destroyed = true
    this.port.destroy(new Error('Agent was destroyed'))
  }

  createSocket(
    req: http.ClientRequest,
    options: NodeJS.Dict<unknown>,
    cb: (err: Error | string | null, stream?: Duplex) => void
  ): void {
    // copied from _http_agent.js, replacing this.createConnection
    this.log('info', `creating usb socket wrapper to ${this.options.path}`)
    options = { __proto__: null, ...options, ...this.options }
    const name = this.getName(options)
    options._agentKey = name
    options.encoding = null
    if (this.totalSocketCount >= 1) {
      this.log('error', `tried to create more than one socket wrapper`)
      cb(new Error('Cannot create more than one USB port wrapper'))
      return
    }
    if (!this.port.isOpen) {
      this.log('error', `tried to create usb socket wrapper with closed port`)
      cb(new Error('Underlying USB port is closed'))
      return
    }

    const wrapper = socketEmulatorFromPort(this.port)
    this.totalSocketCount++
    installListeners(this, wrapper, options)
    this.log('info', `created usb socket wrapper writable: ${wrapper.writable}`)
    cb(null, wrapper)
    setImmediate(() => {
      wrapper.emit('connect')
      wrapper.emit('ready')
    })
  }
}

// most copied from _http_agent.js; onData and onFinish listeners added to log and close serial port
function installListeners(
  agent: SerialPortHttpAgent,
  s: Socket,
  options: { [k: string]: unknown }
): void {
  const onFree: () => void = () => {
    // The node http-client and node http-agent conspire to jam this random
    // _httpMessage attribute onto the sockets they use so they can get to a
    // message from the socket that it was on. We need to make sure that the socket
    // has this message and that message says it should be kept alive to make the
    // agent's removeSocket function not destroy the socket instead. We could override
    // the function, but we need the entire thing except like one conditional so we do this.

    agent.log('debug', 'CLIENT socket onFree')
    agent.emit('free', s, options)
  }
  s.on('free', onFree)

  function onError(err: Error): void {
    agent.log('error', `CLIENT socket onError: ${err?.message}`)
  }
  s.on('error', onError)

  function onClose(): void {
    agent.log('debug', 'CLIENT socket onClose')
    agent.totalSocketCount--
    agent.removeSocket(s, options)
  }
  s.on('close', onClose)

  function onFinish(): void {
    agent.log('info', 'socket finishing')
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
    s.removeListener('finish', onFinish)
    s.removeListener('agentRemove', onRemove)
    if (agent[kOnKeylog] != null) {
      s.removeListener('keylog', agent[kOnKeylog])
    }
  }
  s.on('agentRemove', onRemove)
}

export { SerialPortHttpAgent }
