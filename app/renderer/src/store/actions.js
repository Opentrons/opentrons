import Vue from 'vue'
import * as types from './mutation-types'
import OpenTrons from '../rest_api_wrapper'
import {addHrefs} from '../util'


const actions = {
  connect_robot ({ commit }, port) {
    const payload = {is_connected: true, 'port': port}
    OpenTrons.connect(port).then((was_successful) => {
      if (was_successful) commit(types.UPDATE_ROBOT_CONNECTION, payload)
    })
  },
  disconnect_robot ({ commit }) {
    OpenTrons.disconnect().then((was_successful) => {
      if (was_successful) {
        commit(types.UPDATE_ROBOT_CONNECTION, {'is_connected': false, 'port': null})
      }
    })
  },
  updateFilename ({commit}, fileName) {
    commit(types.UPDATE_FILE_NAME, {'fileName': fileName})
  },
  uploadProtocol ({commit}, formData) {
    OpenTrons.uploadProtocol(formData).then((result) =>{
      if (result.success) {
        let tasks = result.calibrations
        addHrefs(tasks)
        commit('UPDATE_TASK_LIST', {'tasks': tasks})
      } else {
        commit('UPDATE_TASK_LIST', {tasks: []})
      }
      commit('UPDATE_WARNINGS', {warning: result.warnings})
      commit('UPDATE_ERROR', {errors: result.errors})
    })
  },
  selectIncrement ({commit}, data) {
    commit(types.UPDATE_INCREMENT, {
      'current_increment': data.inc, 'type': data.type })
  },
  jog ({commit}, coords) {
    OpenTrons.jog(coords)
  },
  jogToSlot ({commit}, data) {
    OpenTrons.jogToSlot(data)
  },
  calibrate({commit}, data) {
    let type = "instrument"
    if (data.slot) { type = "placeable"}
    OpenTrons.calibrate(data, type)
  },
  moveToPlaceable({commit}, data) {
    Vue.http
    .post('http://localhost:5000/move_to_container', JSON.stringify(data), {emulateJSON: true})
    .then((response) => {
       console.log('success',response)
    }, (response) => {
       console.log('failed', response)
    })
  },
  moveToPlungerPosition({commit}, data){
    Vue.http
    .post('http://localhost:5000/move_to_plunger_position', JSON.stringify(data), {emulateJSON: true})
    .then((response) => {
       console.log('success',response)
    }, (response) => {
       console.log('failed', response)
    })
  }

}

export default {
  actions
}
