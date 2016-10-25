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
        if (response.body.data.errors) {
          commit(types.UPDATE_ERROR, {errors: response.body.data.errors})
        } else {
          var tasks = response.body.data.calibrations
          tasks.map((instrument) => {
            instrument.href = instrumentHref(instrument)
            instrument.placeables.map((placeable) => {
              placeable.href = placeableHref(placeable, instrument)
            })
          })
          commit(types.UPDATE_ERROR, {errors: []})
          commit(types.UPDATE_TASK_LIST, {'tasks': tasks})
        }
      }, (response) => {
        console.log('failed to upload', response)
      })
  },
  selectIncrement ({commit}, data) {
    console.log("updating increment to " + data.inc + " for " + data.type)
    commit(types.UPDATE_INCREMENT, {
      'current_increment': data.inc,
      'type': data.type
    })
  },
  jog ({commit}, coords) {
    console.log(coords)
    Vue.http
      .post('http://localhost:5000/jog', JSON.stringify(coords), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  },
  jogToSlot ({commit}, data) {
    Vue.http
      .post('http://localhost:5000/move_to_slot', JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }
}


export default {
  actions
}