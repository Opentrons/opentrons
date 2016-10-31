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
  coordinates: {"x":0, "y":0, "z":0, "a":0, "b":0},
  run_state: "ready",
  run_log: [],
  run_plan: []
}
//Note: Ahmed, the run_states I need returned for the toggling are "ready","running", and "paused"

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
  [types.RESET_RUN_LOG] (state) {
    state.run_log = []
  },
  [types.UPDATE_RUN_LOG] (state, payload) {
    state.run_log.push(payload)
  },
  [types.UPDATE_RUN_PLAN] (state, payload) {
    state.run_plan = payload.run_plan
  },
  [types.UPDATE_POSITION] (state, payload) {
    state.coordinates = payload
  }
}


export default {
  mutations,
  state
}