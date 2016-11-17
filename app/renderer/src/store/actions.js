import Vue from 'vue'
import * as types from './mutation-types'
import Opentrons from '../rest_api_wrapper'
import {addHrefs, processTasks} from '../util'


const actions = {
  connect_robot ({ commit }, port) {
    const payload = {is_connected: true, 'port': port}
    Opentrons.connect(port).then((was_successful) => {
      if (was_successful) {
        commit(types.UPDATE_ROBOT_CONNECTION, payload)
        if (window.confirm("Successfully Connected. Do you want to home now?")) {
          Opentrons.home('all')
        }
        Opentrons.getVersions().then((result) => {
          let versions = result
          commit(types.UPDATE_ROBOT_VERSIONS, {versions})
        })
      }
    })
  },
  disconnect_robot ({ commit }) {
    Opentrons.disconnect().then((was_successful) => {
      if (was_successful) {
        commit(types.UPDATE_ROBOT_CONNECTION, {'is_connected': false, 'port': null})
      }
    })
  },
  uploadProtocol ({commit}, formData) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    commit(types.UPLOADING, {'uploading': true})
    Opentrons.uploadProtocol(formData).then((result) => {
      let tasks
      if (result.success) {
        tasks = processTasks(result, commit)
      } else {
        tasks = []
      }
      commit(types.UPDATE_WARNINGS, {warning: result.warnings})
      commit(types.UPDATE_ERROR, {errors: result.errors})
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
      commit(types.UPLOADING, {'uploading': false})
      commit(types.UPDATE_TASK_LIST, {'tasks': tasks})
    })
  },
  loadProtocol ({commit}) {
    Opentrons.loadProtocol().then((result) => {
      if (result.success) {
        let tasks = processTasks(result, commit)
        commit(types.UPDATE_TASK_LIST, {tasks})
      } else {
        commit(types.UPDATE_TASK_LIST, {tasks: []})
      }
    })
  },
  selectIncrement ({commit}, data) {
    commit(types.UPDATE_INCREMENT, { 'current_increment': data.inc })
  },
  selectIncrementPlunger ({commit}, data) {
    commit(types.UPDATE_INCREMENT_PLUNGER, { 'current_increment_plunger': data.inc })
  },
  jog ({commit}, coords) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.jog(coords).then((result) => {
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
    })
  },
  jogToSlot ({commit}, data) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.jogToSlot(data).then(() => {
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
    })
  },
  calibrate ({commit}, data) {
    let type = "plunger"
    if (data.slot) { type = "placeable"}
    Opentrons.calibrate(data, type).then((tasks) => {
      if (tasks) {
        commit('UPDATE_TASK_LIST', {'tasks': tasks})
      }
    })
  },
  moveToPlaceable({commit}, data) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Vue.http
    .post('http://localhost:31950/move_to_container', JSON.stringify(data), {emulateJSON: true})
    .then((response) => {
       commit(types.UPDATE_ROBOT_STATE, {'busy': false})
       console.log('success',response)
    }, (response) => {
       commit(types.UPDATE_ROBOT_STATE, {'busy': true})
       console.log('failed', response)
    })
  },
  runProtocol({ commit }) {
    commit(types.UPDATE_RUNNING, {'running': true})
    commit(types.RESET_RUN_LOG)
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.runProtocol()
  },
  pauseProtocol({ commit }) {
    Opentrons.pauseProtocol().then((was_successful) => {
      console.log(was_successful)
      if (was_successful) {
        commit(types.UPDATE_PAUSED, was_successful)
      }
    })
  },
  resumeProtocol({ commit }) {
    Opentrons.resumeProtocol().then((was_successful) => {
      console.log(was_successful)
      if (was_successful) {
        commit(types.UPDATE_PAUSED, !was_successful)
      }
    })
  },
  cancelProtocol({ commit }) {
    Opentrons.cancelProtocol()
  },
  moveToPosition ({commit}, data) {
    let type = "plunger"
    if (data.slot) { type = "placeable" }
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.moveToPosition(data, type).then(() => {
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
    })
  },
  pickUpTip ({commit}, data) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.pickUpTip(data).then(() => {
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
    })
  },
  dropTip ({commit}, data) {
    Opentrons.dropTip(data)
  },
  aspirate ({commit}, data) {
    Opentrons.aspirate(data)
  },
  dispense ({commit}, data) {
    Opentrons.dispense(data)
  },
  maxVolume({commit}, data) {
    Opentrons.maxVolume(data).then((result) => {
      if (result) {
        Opentrons.loadProtocol().then((result) => {
          if (result.success) {
            let tasks = processTasks(result, commit)
            commit(types.UPDATE_TASK_LIST, {tasks})
          } else {
            commit(types.UPDATE_TASK_LIST, {tasks: []})
          }
        })
      }
    })
  },
  home ({commit}, data) {
    commit(types.UPDATE_ROBOT_STATE, {'busy': true})
    Opentrons.home(data.axis).then(() => {
      commit(types.UPDATE_ROBOT_STATE, {'busy': false})
    })
  }
}

export default {
  actions
}
