import Vue from 'vue'
import {addHrefs} from './util'


class OpenTrons {
  constructor (base_url) {
    this.base_url = base_url || 'http://localhost:5000'
    this.connectUrl = this.base_url + '/robot/serial/connect'
    this.disconnectUrl = this.base_url + '/robot/serial/disconnect'
    this.jogUrl = this.base_url + '/jog'
    this.jogToSlotUrl = this.base_url + '/move_to_slot'
    this.runPlanUrl = this.base_url + '/run-plan'
    this.runProtocolUrl = this.base_url + '/run'
    this.jogToContainerUrl = this.base_url + '/move_to_container'
    this.jogToPlungerUrl = this.base_url + '/move_to_plunger_position'
    this.pickUpTipUrl = this.base_url + '/pick_up_tip'
    this.dropTipUrl = this.base_url + '/drop_tip'
    this.pauseProtocolUrl = this.base_url + '/pause'
    this.resumeProtocolUrl = this.base_url + '/resume'
    this.getPortsListUrl = this.base_url + '/robot/serial/list'
  }

  getPortsList() {
    return Vue.http
      .get(this.getPortsListUrl)
      .then((response) => {
        return response.data.ports || []
      }, (response) => {
        console.log('failed to get serial ports list', response)
      })
  }

  connect (port) {
    let options = {'port': port}
    return Vue.http
      .post(this.connectUrl, options)
      .then((response) => {
        if (response.data.status === "success") {
          console.log('successfully connected...')
          return true
        } else {
          console.log('connection failed...')
          return false
        }
      }, (response) => {
        console.log('failed to connect', response)
      })
  }

  disconnect () {
    return Vue.http
      .get(this.disconnectUrl)
      .then((response) => {
        if (response.data.status === "success") {
          console.log("disconnected from robot")
          return true
        } else {
          return false
        }
      }, (response) => {
        console.log('Failed to communicate to server', response)
      })
  }

  moveToPosition(data, type) {
    let url = this.jogToContainerUrl
    if (type == "plunger") { url = this.jogToPlungerUrl }

    return Vue.http
      .post(url, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
        return true
      }, (response) => {
        console.log('failed', response)
        return false
      })
  }

  jog (coords) {
    return Vue.http
      .post(this.jogUrl, JSON.stringify(coords), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
        if (response.body.status == 'error') {
          console.log("Error in Jog: " + response.body.data)
        }
        return true
      }, (response) => {
        console.log('failed', response)
        return false
      })
  }

  jogToSlot (data) {
    return Vue.http
      .post(this.jogToSlotUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  uploadProtocol (formData) {
    return Vue.http
      .post('http://localhost:5000/upload', formData)
      .then((response) => {
        let result = {success: true, errors: [], warnings: [], calibrations: []}
        let data = response.body.data
        result.errors = data.errors
        result.warnings = data.warnings
        result.calibrations = data.calibrations || []
        if (data.errors.length > 0) {
          result.success = false
        }
        result.fileName = data.fileName
        return result
      }, (response) => {
        console.log('Failed to upload protocol', response)
        return {success: false}
      })
  }
  getRunPlan () {
    return Vue.http
      .get(this.runPlanUrl)
      .then((response) => {
        if (response.body.status == 'success') {
          return response.body.data || []
        }
        return []
      }, (response) => {
        console.log('failed', response)
      })
  }
  runProtocol () {
    return Vue.http
      .get(this.runProtocolUrl)
      .then((response) => {
        console.log("Protocol run successfully initiated", response)
      }, (response) => {
        console.log("Protocol run failed to execute", response)
      })
  }
  pauseProtocol () {
    return Vue.http
      .get(this.pauseProtocolUrl)
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }
  resumeProtocol () {
    return Vue.http
      .get(this.resumeProtocolUrl)
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }
  calibrate(data, type) {
    return Vue.http
      .post(`${this.base_url}/calibrate_${type}`, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        let tasks = response.body.data.calibrations
        addHrefs(tasks)
        return tasks
      }, (response) => {
         console.log('failed', response)
         return false
      })
  }

  pickUpTip (data) {
    return Vue.http
      .post(this.pickUpTipUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  dropTip (data) {
    return Vue.http
      .post(this.dropTipUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  home (axis) {
    return Vue.http
        .get(`/home/${axis}`)
        .then((response) => {
            console.log(response)
            console.log(`Homing ${axis}`)
        }, (response) => {
            console.log('failed to home', response)
        })
  }
}

export default new OpenTrons('http://localhost:5000')
