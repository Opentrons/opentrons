import Vue from 'vue'


class OpenTrons {
  constructor(base_url) {
    this.base_url = base_url || 'http://localhost:5000'
    this.connectUrl = this.base_url + '/robot/serial/connect'
    this.disconnectUrl = this.base_url + '/robot/serial/disconnect'
    this.jogUrl = this.base_url + '/jog'
    this.jogToSlotUrl = this.base_url + '/move_to_slot'
  }

  connect(port) {
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

  jogToSlot() {
    return Vue.http
      .post(this.jogToSlotUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log("success", response)
      }, (response) => {
        console.log('failed', response)
      })
  }
  uploadProtocol (formData) {
    Vue.http
      .post('http://localhost:5000/upload', formData)
      .then((response) => {
        let returnVal = {success: true, errors: [], warnings: []}
        returnVal.errors = data.errors
        returnVal.warnings = data.warnings
        if (response.body.data.errors.length > 0) {
          returnVal.success = false
        }
        return returnVal
      }, (response) => {
        console.log('Failed to upload protocol', response)
      })
  }
}


export default new OpenTrons('http://localhost:5000')
