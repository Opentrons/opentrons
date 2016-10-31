import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client/socket.io'
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
      if (data.name === "home" && data.axis) {
        let axis_homed = data.axis.split('').map((axis) => {
          return axis.toLowerCase()
        })
        let {x, y, z, a, b} = store._options.state.coordinates
        let current_coordinates = {x, y, z, a, b}
        axis_homed.forEach((axis) => {
          current_coordinates[axis] = 0
          if (axis === "y") { current_coordinates[axis] = 250 }
          if (axis === "z") { current_coordinates[axis] = 120 }
        })
        store.commit(types.UPDATE_POSITION, current_coordinates)
      }
      if (data.name == 'command-run') {
        console.log(data)
        if (data.caller === 'ui') {
          store.commit(types.UPDATE_RUN_LOG, data)
        }
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
