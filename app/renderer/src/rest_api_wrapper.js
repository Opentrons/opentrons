import Vue from 'vue'


class OpenTrons {
  constructor(base_url) {
    this.base_url = base_url || 'http://localhost:5000'
    this.connect_url = this.base_url + '/robot/serial/connect'
    this.disconnect_url = this.base_url + '/robot/serial/disconnect'
  }

  connect(port) {
    let options = {params: {'port': port}}
    return Vue.http
      .get(this.connect_url, options)
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
    Vue.http
      .get(this.disconnect_url)
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
}


export default new OpenTrons('http://localhost:5000')
