import type { Action } from '../../types'

export function robotSystemReducer(state = false, action: Action): boolean {
  switch (action.type) {
    case 'shell:SEND_READY_STATUS': {
      return action.payload.shellReady
    }
  }

  return state
}
