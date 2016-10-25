import * as types from './mutation-types'


const state = {
  is_connected: false,
  port: null,
  fileName: "Select Protocol",
  errors: [],
  warnings: false,
  tasks: [],
  current_increment_placeable: 5,
  current_increment_plunger: 1,
  coordinates: {"x":0, "y":0, "z":0, "a":0, "b":0}
}


const mutations = {
  [types.UPDATE_ROBOT_CONNECTION] (state, payload) {
    state.is_connected = payload.is_connected
    state.port = payload.port
  },
  [types.UPDATE_TASK_LIST] (state, payload) {
    state.tasks = payload.tasks
  },
  [types.UPDATE_FILE_NAME] (state, payload) {
    state.fileName = payload.fileName
  },
  [types.UPDATE_INCREMENT] (state, payload) {
    if (payload.type == "placeable") {
      state.current_increment_placeable = payload.current_increment
    } else {
      state.current_increment_plunger = payload.current_increment
    }
  },
  [types.UPDATE_ERROR] (state, payload) {
    state.errors = payload.errors
  },
  [types.UPDATE_WARNINGS] (state, payload) {
    state.warnings = payload.warnings
  },
  [types.UPDATE_POSITION] (state, payload) {
    state.coordinates = payload
  }
}


export default {
  mutations,
  state
}