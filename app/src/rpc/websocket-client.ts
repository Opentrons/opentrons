// browser websocket client event-emitter/JSON wrapper for convenience
import EventEmitter from 'events'
// TODO(mc, 2017-08-29): Disable winston because of worker-loader bug
// preventing webpackification of built-in node modules
// import log from 'winston'

// TODO(mc): find out if buffering incomplete messages if needed
// ws frame size is pretty big, though, so it's probably unnecesary
function parseMessage(data) {
  let message

  try {
    message = JSON.parse(data)
  } catch (e) {
    // log.warn('JSON parse error', e)
  }

  return message
}

export class WebSocketClient extends EventEmitter {
  constructor(url) {
    super()
    this._ws = new WebSocket(url)
    this._ws.onopen = () => this.emit('open')
    this._ws.onmessage = e => this.emit('message', parseMessage(e.data))
    this._ws.onclose = e => this.emit('close', e.code, e.reason, e.wasClean)
    this._ws.onerror = error => this.emit('error', error)

    // also export websocket readyState constants
    this.CONNECTING = WebSocket.CONNECTING
    this.OPEN = WebSocket.OPEN
    this.CLOSING = WebSocket.CLOSING
    this.CLOSED = WebSocket.CLOSED
  }

  get readyState() {
    return this._ws.readyState
  }

  get url() {
    return this._ws.url
  }

  close(code, reason) {
    this._ws.close(code, reason)
  }

  send(data) {
    this._ws.send(JSON.stringify(data))
  }
}
