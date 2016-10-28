import Vue from 'vue'


class OpenTrons {
  constructor (base_url) {
    this.base_url = base_url || 'http://localhost:5000'
    this.connectUrl = this.base_url + '/robot/serial/connect'
    this.disconnectUrl = this.base_url + '/robot/serial/disconnect'
    this.jogUrl = this.base_url + '/jog'
    this.jogToSlotUrl = this.base_url + '/move_to_slot'
    this.runPlanUrl = this.base_url + '/run-plan'
  }

  connect (port) {
    let options = {params: {'port': port}}
    return Vue.http
      .post(this.connectUrl, options)
      .then((response) => {
        console.log('successfully connected...')
        if (response.data.status === "success") {
          return true
        } else {
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
          return true
        } else {
          return false
        }
      }, (response) => {
        console.log('Failed to communicate to server', response)
      })
  }

  jog (coords) {
    return Vue.http
      .post(this.jogUrl, JSON.stringify(coords), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
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
        return result
      }, (response) => {
        console.log('Failed to upload protocol', response)
      })
  }
  getRunPlan () {
    return Vue.http
      .get(this.runPlanUrl)
      .then((response) => {
        let result = response.body.data
        if (result.status == 'success') {
          return result.data || []
        }
        return response.data || []
      }, (response) => {
        console.log('failed', response)
      })
  }

  runProtocol () {
    return Vue.http
      .get(this.runProtocolUrl)
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }
}

export default new OpenTrons('http://localhost:5000')
