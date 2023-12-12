import * as http from 'http'
import agent from 'agent-base'
import type { Duplex } from 'stream'

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


class SerialPortSocket extends SerialPort {
  // added these to squash keepAlive errors
  setKeepAlive(): void {}
  unref(): SerialPortSocket { return this}
  setTimeout(): void {}
  ref(): SerialPortSocket {return this }
  // We never actually really want to destroy our serial port sockets, but
  // the abort logic (at least) in node http client actually has a call stack
  // that requires the socket close event to happen (???) so this is for that.
  // We only really seem to abort when there's a 3xx return because we use
  // npm follow-redirects and that aborts on a 3xx
  destroy(error?: Error): void {
    if (!!!this.destroyed) {
      this.destroyed = true
      this.close()
    }
  }
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
  createSocket(
    req: http.ClientRequest,
    options: NodeJS.Dict<unknown>,
    cb: Function
  ): void {
  // copied from _http_agent.js, replacing this.createConnection
  this.log('info', `creating usb socket at ${this.options.path}`)
      options = { __proto__: null, ...options, ...this.options }
      const name = this.getName(options)
      options._agentKey = name
      options.encoding = null
  // We preemptively increase the socket count and then reduce it if we
  // actually failed because more requests will come in as soon as this function
  // function finishes and if we don't increment it here those messages will also
  // try and make new sockets
  this.totalSocketCount++
  const oncreate = (err: any | null, s?: SerialPortSocket) => {
    if (err != null) {
      this.totalSocketCount--
      return cb(err)
    }
    if (this.sockets[name] == null) {
      this.sockets[name] = []
    }
    this.sockets[name]?.push((s as unknown) as Socket)
    this.log(
      'debug',
      `sockets ${name} ${this.sockets[name]?.length ?? ''} ${
       this.totalSocketCount
      }`
    )
    installListeners(this, s as SerialPortSocket, options)
    cb(null, s)
  }
  // we do retries via recursion because this is all callback based anyway
  const createSocketInner: (
      req: http.ClientRequest,
      options: NodeJS.Dict<unknown>,
      cb: Function,
      remainingRetries: number 
    ) => void = (req, options, cb, remainingRetries) => {
    const socket: SerialPortSocket = new SerialPortSocket({
      path: this.options.path,
      baudRate: 1152000,
      // setting autoOpen false makes the rest of the logic a little easier because
      // we always go through the "open-after-constructor" codepath
      autoOpen: false
    })
    socket.open(
      err => {
        if (err) {
          if (remainingRetries > 0) {
            setTimeout(() => createSocketInner(req, options, cb, remainingRetries - 1), SOCKET_OPEN_RETRY_TIME_MS)
          } else {
            oncreate(err)
          }
        } else {
          oncreate(err, socket)
        }
       })
    }
    createSocketInner(req, options, cb, MAX_SOCKET_CREATE_RETRIES)
  }
}

// most copied from _http_agent.js; onData and onFinish listeners added to log and close serial port
function installListeners(
  agent: SerialPortHttpAgent,
  s: SerialPortSocket,
  options: { [k: string]: unknown }
): void {
  const onFree: ()=> void = () => {
    // The node http-client and node http-agent conspire to jam this random
    // _httpMessage attribute onto the sockets they use so they can get to a
    // message from the socket that it was on. We need to make sure that the socket
    // has this message and that message says it should be kept alive to make the
    // agent's removeSocket function not destroy the socket instead. We could override
    // the function, but we need the entire thing except like one conditional so we do this.

    agent.log('debug', 'CLIENT socket onFree')
    // need to emit free to attach listeners to serialport
    if (s._httpMessage) {
      s._httpMessage.shouldKeepAlive = true
    }
    agent.emit('free', s, options)
  }
  s.on('free', onFree)

  s.on('open', () => {
    s.emit('connect')
    s.emit('ready')
  })

  function onError(err: Error): void {
    agent.log('error', `CLIENT socket onError: ${err?.message}`)
  }
  s.on('error', onError)

  function onClose(): void {
    agent.log('debug', 'CLIENT socket onClose')
    // the 'close' event is emitted both by the serial port stream when it closes
    // the serial port (yay) and by both the readable and writable streams that the
    // serial port inherits from when they close which has nothing to do with the serial
    // port (boo!) so if we get a close event we need to check if we're actually closed
    // and if we're not do a real close (and also only remove the socket from the agent
    // if it's real)

    if (s.isOpen) { 
      s.close()
    } else {
      agent.totalSocketCount--
      agent.removeSocket(s, options)
    }
  }
  s.on('close', onClose)

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
    s.removeListener('finish', onFinish)
    s.removeListener('agentRemove', onRemove)
    if (agent[kOnKeylog] != null) {
      s.removeListener('keylog', agent[kOnKeylog])
    }
  }
  s.on('agentRemove', onRemove)
}

export { SerialPortHttpAgent }
