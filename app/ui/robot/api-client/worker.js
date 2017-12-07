// api client webworker
// handles message stringification and destructuring
import client from './client'

// client function takes a dispatch function and returns a receive handler
const receive = client(dispatchFromWorker)

self.onmessage = function handleIncoming (event) {
  const {state, action} = event.data

  receive(state, action)
}

function dispatchFromWorker (action) {
  // webworkers cannot post Error objects, so convert them to plain objects
  if (action.error === true) {
    const {payload} = action

    action.payload = Object.assign(
      {name: payload.name, message: payload.message},
      payload
    )
  }

  self.postMessage(action)
}
