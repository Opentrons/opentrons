import Vue from 'vue'

import * as types from './mutation-types'

import OpenTrons from '../rest_api_wrapper'


const actions = {
  connect_robot ({ commit }, port) {
    const payload = {is_connected: true, 'port': port}
    OpenTrons.connect(port).then((was_successful) => {
      if (was_successful) commit(types.UPDATE_ROBOT_CONNECTION, payload)
    })
  },
  disconnect_robot ({ commit }) {
    OpenTrons.connect(port).then((was_successful) => {
      if (was_successful) {
        commit(types.UPDATE_ROBOT_CONNECTION, {'is_connected': false, 'port': null})
      }
    })
  },

  updateFilename ({commit}, fileName) {
    commit(types.UPDATE_FILE_NAME, {'fileName': fileName})
  },
  uploadProtocol ({commit}, formData) {
    Vue.http
      .post('http://localhost:5000/upload', formData)
      .then((response) => {
        console.log(response)
        if (response.body.data.errors.length > 0) {
          commit('UPDATE_TASK_LIST', {tasks: []})
          commit('UPDATE_ERROR', {errors: response.body.data.errors})
        } else if (response.body.data.warnings.length > 0) {
          commit('UPDATE_WARNINGS', {warnings: response.body.data.warnings})
        } else {
          var tasks = response.body.data.calibrations
          tasks.map((instrument) => {
            instrument.href = instrumentHref(instrument)
            instrument.placeables.map((placeable) => {
              placeable.href = placeableHref(placeable, instrument)
            })
          })
          commit('UPDATE_ERROR', {errors: []})
          Vue.http.get('http://localhost:5000/robot/coordinates').then((response) => {
            console.log(response)
          })
          commit('UPDATE_TASK_LIST', {'tasks': tasks})
        }
      }, (response) => {
        console.log('failed to upload', response)
      })
  },
  selectIncrement ({commit}, data) {
    console.log("updating increment to " + data.inc + " for " + data.type)
    commit(types.UPDATE_INCREMENT, {
      'current_increment': data.inc, 'type': data.type })
  },
  jog ({commit}, coords) {
    console.log(coords)
    OpenTrons.jog(coords)
  },
  jogToSlot ({commit}, data) {
    OpenTrons.jogToSlot(data)
  }
}


export default {
  actions
}