export const MOVE = 'MOVE';
export const HOME = 'HOME';
export const LOAD_PROTOCOL = 'LOAD_POROTOCOL';
export const CONNECT = 'CONNECT';
export const DISCONNECT = 'DISCONNECT';
export const STOP = 'STOP';
export const PAUSE = 'PAUSE';
export const RUN = 'RUN';

export async function move(axis, coordinate, mode) {
  return (dispatch) => {
    const res = await fetch('http://localhost:31950/move')
    dispatch(() => {
        type: MOVE
    })
  }
}

export async function home(axis) {
  return (dispatch) => {
    const res = await fetch('http://localhost:31950/home')
  }
}

export function decrement() {
  return {
    type: DECREMENT_COUNTER
  };
}

