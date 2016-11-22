import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client/socket.io'
import * as types from './mutation-types'
import app_mutations from './mutations'
import app_actions from './actions'
import { createModule, ADD_TOAST_MESSAGE } from 'vuex-toast'


const { mutations, state } = app_mutations
const { actions } = app_actions
Vue.use(Vuex)

function createWebSocketPlugin(socket) {
  return store => {
    socket.on('event', data => {
      if (data.type === 'connection_status') {
        if (data.is_connected === false) {
          store.commit(types.UPDATE_ROBOT_CONNECTION, {'is_connected': false, 'port': null})
        }
      }
      if (data.name === 'move-finished') {
        store.commit(types.UPDATE_POSITION, {
          x: data.position.head.x,
          y: data.position.head.y,
          z: data.position.head.z,
          a: data.position.plunger.a,
          b: data.position.plunger.b
        })
      }
      if (data.name === "home" && data.axis) {
        let axis_homed = data.axis.split('').map((axis) => {
          return axis.toLowerCase()
        })
        store.commit(types.UPDATE_POSITION, {
          x: data.position.head.x,
          y: data.position.head.y,
          z: data.position.head.z,
          a: data.position.plunger.a,
          b: data.position.plunger.b
        })
      }
      if (data.name == 'command-run') {
        if (data.caller === 'ui') {
          store.commit(types.UPDATE_RUN_LOG, data)
          store.commit(types.UPDATE_RUN_LENGTH, data)
        }
      }
      if (data.name == 'notification') {
        if (data.text.length > 0){
          let {text, type} = data
          text = `${text}`
          store.dispatch(ADD_TOAST_MESSAGE, {text, type})
        }
      }
      if (data.name == 'run-finished') {
        store.commit(types.UPDATE_ROBOT_STATE, {'busy': false})
        store.commit(types.UPDATE_RUNNING, {'running': false})
      }
    })
  }
}

const socket = io.connect('ws://localhost:31950')

socket.on('connect', function(){
  console.log('WebSocket has connected.')
  socket.emit('connected')
});

socket.on('disconnect', function(){
  console.log('WebSocket has disconnected')
})

const websocketplugin = createWebSocketPlugin(socket)
const toast = createModule({dismissInterval: 12000})

export default new Vuex.Store({
  state,
  actions,
  mutations,
  plugins: [websocketplugin],
  modules: {toast}
})
