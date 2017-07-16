export const MOVE = 'MOVE'
export const HOME = 'HOME'
export const LOAD_PROTOCOL = 'LOAD_POROTOCOL'
export const CONNECT = 'CONNECT'
export const DISCONNECT = 'DISCONNECT'
export const STOP = 'STOP'
export const PAUSE = 'PAUSE'
export const RUN = 'RUN'

export function move(axis, coordinate, mode) {
  return async (dispatch) => {
    await fetch('http://localhost:31950/move')
    dispatch(() => {
        type: MOVE
        payload: {}
    })
  }
}

export function home(axis) {
  return async (dispatch) => {
    await fetch('http://localhost:31950/home')
  }
}

export function load(protocol) {
  return async (dispatch) => {
    await fetch('http://localhost:31950/load')
  }
}

