import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'
import * as types from './mutation-types'
import app_mutations from './mutations'
import app_actions from './actions'


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
      if (data.name === "home") {
        store.commit(types.UPDATE_POSITION, {x: 0, y: 0, z: 0, a: 0, b: 0})
      }
    })
  }
}

const socket = io.connect('ws://localhost:5000')

socket.on('connect', function(){
  console.log('WebSocket has connected.')
  socket.emit('connected')
});

socket.on('disconnect', function(){
  console.log('WebSocket has disconnected')
})

const websocketplugin = createWebSocketPlugin(socket)

export default new Vuex.Store({
  state,
  actions,
  mutations,
  plugins: [websocketplugin]
})
