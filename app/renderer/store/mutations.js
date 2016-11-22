import * as types from './mutation-types'


const state = {
  is_connected: false,
  port: null,
  fileName: "",
  lastModified: "",
  errors: [],
  warnings: false,
  tasks: [],
  current_increment_placeable: 1,
  current_increment_plunger: 1,
  coordinates: {"x":0, "y":0, "z":0, "a":0, "b":0},
  run_log: [],
  run_length: 0,
  busy: false,
  versions: [],
  uploading: false,
  running: false,
  paused: false,
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
  [types.UPDATE_FILE_MODIFIED] (state, payload) {
    state.lastModified = payload.lastModified
  },
  [types.UPDATE_INCREMENT] (state, payload) {
    state.current_increment_placeable = payload.current_increment
  },
  [types.UPDATE_INCREMENT_PLUNGER] (state, payload) {
    state.current_increment_plunger = payload.current_increment_plunger
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
  [types.UPDATE_POSITION] (state, payload) {
    state.coordinates = payload
  },
  [types.UPDATE_ROBOT_STATE] (state, payload) {
    state.busy = payload.busy
  },
  [types.UPDATE_ROBOT_VERSIONS] (state, payload) {
    state.versions = payload.versions
  },
  [types.UPLOADING] (state, payload) {
    state.uploading = payload
  },
  [types.UPDATE_RUNNING] (state, payload) {
    state.running = payload.running
  },
  [types.UPDATE_RUN_LENGTH] (state, payload) {
    state.run_length = payload.commands_total
  },
  [types.UPDATE_PAUSED] (state, payload) {
    state.paused = payload
  }
}


export default {
  mutations,
  state
}
