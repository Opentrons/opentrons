import Vue from 'vue'
import Vuex from 'vuex'
import appMutations from './mutations'
import appActions from './actions'
import { createModule } from 'vuex-toast'
import wsp from './websocket-plugin'
import io from 'socket.io-client/dist/socket.io'

const { WebSocketPlugin } = wsp

const { mutations, state } = appMutations
const { actions } = appActions

Vue.use(Vuex)

const socket = io('ws://localhost:31950')
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
