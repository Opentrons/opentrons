import { ADD_TOAST_MESSAGE } from 'vuex-toast'

import * as types from './mutation-types'
import { processTasks } from '../util'
import { trackEventFromWebsocket } from '../analytics'

function handleJupyterUpload (store, data) {
  let tasks = data.data
  processTasks(tasks, store.commit)
  store.commit(types.UPDATE_TASK_LIST, { tasks: tasks.calibrations })
}

function WebSocketPlugin (socket) {
  return store => {
    socket.on('event', data => {
      /*
       * Send analytics event for messages that meet certain conditions.
       * This needs to be at this top level root because certain events
       * Are captured in the if statement for toast notification and run screen
       * TODO: Refactor websocket events so that they are not showing up as both
       * Toast notifications and RunLog events
       */
      trackEventFromWebsocket(data)

      if (data.type === 'connection_status') {
        if (data.isConnected === false) {
          store.commit(types.UPDATE_ROBOT_CONNECTION, {'isConnected': false, 'port': null})
        }
      }
      if (data.name === 'move-finished') {
        store.commit(types.UPDATE_POSITION, {
          x: data.position.head.x,
          y: data.position.head.y,
          z: data.position.head.z,
          a: data.position.plunger.a,
          b: data.position.plunger.b
        }, { silent: true })
      }
      if (data.name === 'home' && data.axis) {
        store.commit(types.UPDATE_POSITION, {
          x: data.position.head.x,
          y: data.position.head.y,
          z: data.position.head.z,
          a: data.position.plunger.a,
          b: data.position.plunger.b
        })
      }
      if (data.name === 'command-run') {
        if (data.caller === 'ui') {
          data.timestamp = (new Date()).toLocaleTimeString()
          store.commit(types.UPDATE_RUN_LOG, data)
          store.commit(types.UPDATE_RUN_LENGTH, data)
        }
      }
      if (data.name === 'notification') {
        if (data.text.length > 0) {
          let {text, type} = data
          text = `${text}`
          store.dispatch(ADD_TOAST_MESSAGE, {text, type})

          data.timestamp = (new Date()).toLocaleTimeString()
          data.command_description = text
          data.notification = true
          trackEventFromWebsocket(data)
          store.commit(types.UPDATE_RUN_LOG, data)
        }
      }
      if (data.name === 'run-finished') {
        store.commit(types.UPDATE_ROBOT_STATE, {'busy': false})
        store.commit(types.UPDATE_RUNNING, {'running': false})
      }
      if (data.name === 'jupyter-upload') {
        console.log('JUPYTER UPLOAD HANDLER DISPATCHED W/', data)
        handleJupyterUpload(store, data)
      }
    })
  }
}

export default { handleJupyterUpload, WebSocketPlugin }
