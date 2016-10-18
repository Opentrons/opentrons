import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'
import {instrumentHref, placeableHref} from './util'

Vue.use(Vuex)

const state = {
    is_connected: false,
    port: null,
    current_protocol_name: "No File Selected",
    errors: "No errors",
    tasks: []
}

const mutations = {
    UPDATE_ROBOT_CONNECTION (state, payload) {
        state.is_connected = payload.is_connected
        state.port = payload.port
    },
    UPDATE_CURRENT_PROTOCOL (state, payload) {
      state.current_protocol_name = payload.current_protocol_name
      state.errors = payload.errors
    },
    UPDATE_TASK_LIST (state, payload) {
      state.tasks = payload.tasks
    }
}

const actions = {
    connect_robot ({ commit }, port) {
        const payload = {is_connected: true, 'port': port}
        let options = {params: {'port': port}}
        Vue.http
            .get('http://localhost:5000/robot/serial/connect', options)
            .then((response) => {
                console.log('successfully connected...')
                console.log('committing with payload:', payload)
                commit('UPDATE_ROBOT_CONNECTION', payload)
            }, (response) => {
                console.log('failed to connect', response)
            })
    },
    disconnect_robot ({ commit }) {
        Vue.http
            .get('http://localhost:5000/robot/serial/disconnect')
            .then((response) => {
                console.log(response)
                if (response.data.is_connected === true){
                    console.log('successfully connected...')
                } else {
                    console.log('Failed to connect', response.data)
                }
                commit('UPDATE_ROBOT_CONNECTION', {'is_connected': false, 'port': null})
            }, (response) => {
                console.log('Failed to communicate to backend server. Failed to connect', response)
            })
    },
    uploadProtocol ({commit}, target) {
      Vue.http
        .post('http://localhost:5000/upload', {file: target.result, filename: target.fileName})
        .then((response) => {
          console.log(response)
          commit('UPDATE_CURRENT_PROTOCOL', {'current_protocol_name': target.fileName, 'errors': response.body.data})
        }, (response) => {
          console.log('failed to upload', response)
        })
    },
    updateTasks ({commit}, target) {
      Vue.http
        .get('http://localhost:5000/instruments/placeables', {protocol: target.result})
        .then((response) => {
          console.log(response)
          let tasks = response.body.data.map((instrument) => {
            instrument.href = instrumentHref(instrument)
            instrument.placeables.map((placeable) => {
              placeable.href = placeableHref(placeable, instrument)
            })
          })
          commit('UPDATE_TASK_LIST', {'tasks': response.body.data})
        }, (response) => {
          console.log('failed to upload', response)
        })
    }
}

function createWebSocketPlugin(socket) {
  return store => {
    socket.on('event', data => {
      if (data.type === 'connection_status') {
        if (data.is_connected === false) {
          store.commit('UPDATE_ROBOT_CONNECTION', {'is_connected': false, 'port': null})
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
