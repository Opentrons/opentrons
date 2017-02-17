import { ADD_TOAST_MESSAGE } from 'vuex-toast'

import * as types from './mutation-types'
import { processTasks } from '../util'

function handleJupyterUpload (store, data) {
  let tasks = data.data
  processTasks(tasks, store.commit)
  store.commit(types.UPDATE_TASK_LIST, { tasks: tasks.calibrations })
}

function WebSocketPlugin (socket) {
  return store => {
    socket.on('event', data => {
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
          let newDate = new Date()
          data.timestamp = newDate.toUTCString().split(' ').slice(-2).join(' ')
          store.commit(types.UPDATE_RUN_LOG, data)
          store.commit(types.UPDATE_RUN_LENGTH, data)
        }
      }
      if (data.name === 'notification') {
        if (data.text.length > 0) {
          let {text, type} = data
          text = `${text}`
          store.dispatch(ADD_TOAST_MESSAGE, {text, type})

          let newDate = new Date()
          data.timestamp = newDate.toUTCString().split(' ').slice(-2).join(' ')
          data.command_description = text
          data.notification = true
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
