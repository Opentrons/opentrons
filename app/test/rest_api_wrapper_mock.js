// This is a mock module to override rest_api_wrapper for testing purposes

var Opentrons = {
  getPortsList() {
    return {
      then: function (cb) {
        return cb(detectedPorts)
      }
    }
  }
}

export const detectedPorts = ['COM1', '/dev/tty.ccu123']
export default Opentrons
