import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'

import app_mutations from './mutations'
const { mutations, state } = app_mutations

import app_actions from './actions'
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
      if (data.type === 'coordinates') {
        store.commit('UPDATE_POSITION', {
          x: data.coordinates.x,
          y: data.coordinates.y,
          z: data.coordinates.z,
          a: data.coordinates.a,
          b: data.coordinates.b
        })
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
