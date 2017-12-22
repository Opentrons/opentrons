// api client webworker
// handles message stringification and destructuring
import client from './client'

let receive

self.onmessage = function handleIncoming (event) {
  // client function takes a dispatch function and returns a receive handler
  // receive function is lazy loaded for efficiency + modularity
  if (!receive) receive = client(dispatchFromWorker)

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
