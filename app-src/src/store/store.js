import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client/socket.io'
import appMutations from './mutations'
import appActions from './actions'
import { createModule } from 'vuex-toast'
import wsp from './websocket-plugin'
const { WebSocketPlugin } = wsp

const { mutations, state } = appMutations
const { actions } = appActions

Vue.use(Vuex)

const socket = io.connect('ws://localhost:31950')
socket.on('connect', function () {
  console.log('WebSocket has connected.')
  socket.emit('connected')
})
socket.on('disconnect', function () {
  console.log('WebSocket has disconnected')
})

const websocketplugin = new WebSocketPlugin(socket)
const toast = createModule({dismissInterval: 12000})

export default new Vuex.Store({
  state,
  actions,
  mutations,
  plugins: [websocketplugin],
  modules: {toast}
})
