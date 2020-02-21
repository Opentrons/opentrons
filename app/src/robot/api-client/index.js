// robot api client redux middleware
// wraps the api client worker to handle API side effects in a different thread

import { createLogger } from '../../logger'
import Worker from './worker'

const log = createLogger(__filename)

const shouldProcess = a => a.meta && (a.meta.robot || a.meta.robotCommand)

export function apiClientMiddleware() {
  const worker = new Worker()

  return store => {
    const { getState, dispatch } = store

    worker.onmessage = function handleWorkerMessage(event) {
      const action = event.data

      // log error actions
      if (action && action.payload) {
        const error =
          action.error === true ? action.payload : action.payload.error

        if (error) {
          log.warn('Error response from robot', { actionType: action.type })
          if (error.traceback) log.warn(error.traceback)
        }
      }

      dispatch(action)
    }

    // initialize worker
    worker.postMessage({})

    return next => action => {
      if (shouldProcess(action)) {
        worker.postMessage({ action, state: getState() })
      }

      return next(action)
    }
  }
}
