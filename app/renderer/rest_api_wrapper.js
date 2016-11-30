import Vue from 'vue'
import {addHrefs, processProtocol} from './util'

class Opentrons {
  constructor (baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:31950'
    this.connectUrl = this.baseUrl + '/robot/serial/connect'
    this.disconnectUrl = this.baseUrl + '/robot/serial/disconnect'
    this.jogUrl = this.baseUrl + '/jog'
    this.jogToSlotUrl = this.baseUrl + '/move_to_slot'
    this.runProtocolUrl = this.baseUrl + '/run'
    this.jogToContainerUrl = this.baseUrl + '/move_to_container'
    this.jogToPlungerUrl = this.baseUrl + '/move_to_plunger_position'
    this.pickUpTipUrl = this.baseUrl + '/pick_up_tip'
    this.dropTipUrl = this.baseUrl + '/drop_tip'
    this.aspirateUrl = this.baseUrl + '/aspirate'
    this.dispenseUrl = this.baseUrl + '/dispense'
    this.maxVolumeUrl = this.baseUrl + '/set_max_volume'
    this.pauseProtocolUrl = this.baseUrl + '/pause'
    this.resumeProtocolUrl = this.baseUrl + '/resume'
    this.cancelProtocolUrl = this.baseUrl + '/cancel'
    this.getPortsListUrl = this.baseUrl + '/robot/serial/list'
    this.versionUrl = this.baseUrl + '/robot/versions'
  }

  getPortsList () {
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
        if (response.data.status === 'success') {
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
        if (response.data.status === 'success') {
          console.log('disconnected from robot')
          return true
        } else {
          return false
        }
      }, (response) => {
        console.log('Failed to communicate to server', response)
      })
  }

  moveToPosition (data, type) {
    let url = this.jogToContainerUrl
    if (type === 'plunger') { url = this.jogToPlungerUrl }

    return Vue.http
      .post(url, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log('success', response)
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
        console.log('success', response)
        if (response.body.status === 'error') {
          console.log('Error in Jog: ' + response.body.data)
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
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  uploadProtocol (formData) {
    return Vue.http
      .post('http://localhost:31950/upload', formData)
      .then((response) => {
        return processProtocol(response)
      }, (response) => {
        console.log('Failed to upload protocol', response)
        return {success: false}
      })
  }

  loadProtocol () {
    return Vue.http
      .get('http://localhost:31950/load')
      .then((response) => {
        return processProtocol(response)
      }, (response) => {
        console.log('Failed to upload protocol', response)
        return {success: false}
      })
  }

  runProtocol () {
    return Vue.http
      .get(this.runProtocolUrl)
      .then((response) => {
        console.log('Protocol run successfully initiated', response)
      }, (response) => {
        console.log('Protocol run failed to execute', response)
      })
  }

  pauseProtocol () {
    return Vue.http
      .get(this.pauseProtocolUrl)
      .then((response) => {
        console.log('success', response)
        return true
      }, (response) => {
        console.log('failed', response)
        return false
      })
  }

  resumeProtocol () {
    return Vue.http
      .get(this.resumeProtocolUrl)
      .then((response) => {
        console.log('success', response)
        return true
      }, (response) => {
        console.log('failed', response)
        return false
      })
  }

  cancelProtocol () {
    return Vue.http
      .get(this.cancelProtocolUrl)
      .then((response) => {
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  calibrate (data, type) {
    return Vue.http
      .post(`${this.baseUrl}/calibrate_${type}`, JSON.stringify(data), {emulateJSON: true})
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
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  dropTip (data) {
    return Vue.http
      .post(this.dropTipUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  aspirate (data) {
    return Vue.http
      .post(this.aspirateUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  dispense (data) {
    return Vue.http
      .post(this.dispenseUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log('success', response)
      }, (response) => {
        console.log('failed', response)
      })
  }

  maxVolume (data) {
    return Vue.http
      .post(this.maxVolumeUrl, JSON.stringify(data), {emulateJSON: true})
      .then((response) => {
        console.log('success', response)
        return true
      }, (response) => {
        console.log('failed', response)
        return false
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

  getVersions () {
    return Vue.http
        .get(this.versionUrl)
        .then((response) => {
          return response.body.versions
        }, (response) => {
          console.log('failed to home', response)
        })
  }
}

export default new Opentrons('http://localhost:31950')
