// simple script to advertise a MDNS service for local API
// TODO(mc, 2017-10-31): remove this file once API can advertise for itself
const os = require('os')
const bonjour = require('bonjour')()
const request = require('superagent')

const LOCAL_API_POLL_INTERVAL_MS = 5000
const LOCAL_API_HOST = os.hostname()
const LOCAL_API_PORT = 31950
const LOCAL_API_HEALTH_URL = `http://localhost:${LOCAL_API_PORT}/health`

const NAME = `Opentrons on ${LOCAL_API_HOST}`
const SERVICE = {
  name: NAME,
  host: LOCAL_API_HOST,
  port: LOCAL_API_PORT,
  type: 'http'
}

startPolling()

function startPolling () {
  setTimeout(pollAndPublish, LOCAL_API_POLL_INTERVAL_MS)
}

function pollAndPublish () {
  request.get(LOCAL_API_HEALTH_URL)
    .ok((response) => response.status === 200)
    .then(() => {
      console.log(`Found local API at ${LOCAL_API_HOST}:${LOCAL_API_PORT}`)
      publish()
    })
    .catch(startPolling)
}

function publish () {
  bonjour.publish(SERVICE)
    .on('up', () => {
      console.log(`Published MDNS service "${NAME}" on ${LOCAL_API_HOST}`)
    })
    .on('error', (error) => {
      console.error('Error publishing MDNS service', error)
      // retry
      startPolling()
    })
}
